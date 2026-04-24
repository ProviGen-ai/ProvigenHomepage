"""Unified Modal app: FastAPI backend + TxGemma vLLM + Biomni (stub).

Deploys the entire workshop backend as a single Modal app with:
  - FastAPI backend (CPU, web endpoint)
  - TxGemma-27B-Chat via vLLM (GPU, internal function)
  - Biomni placeholder (CPU, internal function)

SQLite is persisted on a Modal Volume.

Deploy:
    modal deploy modal/app.py

Required Modal secrets (create once):
    modal secret create workshop-secrets \
        OPENAI_API_KEY=sk-... \
        WORKSHOP_SECRET=your-secret \
        WORKSHOP_ADMIN_PASSWORD=your-password

Optional (for gated HF models):
    modal secret create huggingface HF_TOKEN=hf_...
"""

from pathlib import Path
from typing import Optional

import modal
from pydantic import BaseModel

# Resolve paths relative to this file
THIS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = THIS_DIR.parent / "backend"

# ---------------------------------------------------------------------------
# Request / Response models (must be at module level for Pydantic + FastAPI)
# ---------------------------------------------------------------------------

class RunTaskRequest(BaseModel):
    conversation_id: Optional[str] = None
    task_id: Optional[str] = None
    prompt: str
    mode: str = "custom"

class VoteRequest(BaseModel):
    run_id: str
    model_id: str
    vote: str
    session_id: Optional[str] = None

class BestAnswerRequest(BaseModel):
    conversation_id: str
    run_id: str
    winner_model_id: str
    session_id: Optional[str] = None

class SummarizeRequest(BaseModel):
    prompt: str

class BioReasonRequest(BaseModel):
    example_id: str

class RunModelRequest(BaseModel):
    run_id: str
    model_id: str
    prompt: str

class PollBiomniRequest(BaseModel):
    run_id: str

class AdminAction(BaseModel):
    password: str

# ---------------------------------------------------------------------------
# Shared text formatting
# ---------------------------------------------------------------------------

def _format_markdown_headers(text: str) -> str:
    """Bold standalone header-like lines that aren't already bolded."""
    import re
    # Skip lines already wrapped in **...**
    # Bold numbered section titles: "1. Study design and preprocessing"
    text = re.sub(
        r'^(?!\*\*)(\d+\.\s+[A-Z][^\n]{5,80})$',
        r'**\1**',
        text, flags=re.MULTILINE
    )
    # Bold title-case lines ending with colon: "Key biological signals:"
    # Use [ \t] instead of \s to avoid matching across newlines
    text = re.sub(
        r'^(?!\*\*)([A-Z][A-Za-z \t,/\-()]{5,80}:)[ \t]*$',
        r'**\1**',
        text, flags=re.MULTILINE
    )
    return text

# ---------------------------------------------------------------------------
# Modal App & Volume
# ---------------------------------------------------------------------------

app = modal.App("biomedical-workshop")
db_volume = modal.Volume.from_name("workshop-db", create_if_missing=True)
compile_cache_volume = modal.Volume.from_name("txgemma-compile-cache", create_if_missing=True)
DB_MOUNT_PATH = "/data/db"
COMPILE_CACHE_PATH = "/root/.cache/vllm"

# ---------------------------------------------------------------------------
# Images
# ---------------------------------------------------------------------------

# Backend image — lightweight, no GPU deps, with backend code baked in
backend_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi==0.115.6",
        "uvicorn>=0.34.0",
        "openai>=1.82.0",
        "requests>=2.32.0",
        "pydantic>=2.11.0",
        "python-dotenv>=1.0.0",
    )
    .env({
        "WORKSHOP_DB_DIR": DB_MOUNT_PATH,
        "PYTHONPATH": "/root",
    })
    .add_local_dir(
        str(BACKEND_DIR),
        remote_path="/root/backend",
        ignore=["__pycache__", "*.pyc", "*.db"],
    )
)

# TxGemma image — GPU, vLLM, model weights baked in
TXGEMMA_MODEL = "google/txgemma-27b-chat"
txgemma_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "vllm>=0.8.0",
        "torch>=2.5.0",
        "transformers>=4.48.0",
        "huggingface_hub>=0.27.0",
        "bitsandbytes>=0.45.0",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_commands(
        f'python -c "from huggingface_hub import snapshot_download; snapshot_download(\'{TXGEMMA_MODEL}\')"',
        secrets=[modal.Secret.from_name("huggingface")],
    )
)


# ---------------------------------------------------------------------------
# TxGemma inference function (GPU)
# ---------------------------------------------------------------------------

@app.cls(
    image=txgemma_image,
    gpu="A100-80GB",
    timeout=900,
    scaledown_window=1800,
    secrets=[modal.Secret.from_name("huggingface")],
    volumes={COMPILE_CACHE_PATH: compile_cache_volume},
)
@modal.concurrent(max_inputs=2)
class TxGemmaModel:
    @modal.enter()
    def setup(self):
        import os
        from vllm import LLM

        # Check if compile cache exists from a previous container
        cache_dir = os.path.join(COMPILE_CACHE_PATH, "torch_compile_cache")
        has_cache = os.path.isdir(cache_dir) and len(os.listdir(cache_dir)) > 0

        if has_cache:
            # Compiled cache available — load compiled directly (fast from cache)
            print("[TxGemma] Compile cache found — loading 8-bit compiled model from cache")
            self.llm = LLM(
                model=TXGEMMA_MODEL,
                max_model_len=8192,
                quantization="bitsandbytes",
                load_format="bitsandbytes",
                dtype="bfloat16",
                trust_remote_code=True,
                gpu_memory_utilization=0.90,
            )
            self._needs_swap = False
        else:
            # No cache — start eager for fast cold start, swap later
            print("[TxGemma] No compile cache — starting 8-bit eager mode")
            self.llm = LLM(
                model=TXGEMMA_MODEL,
                max_model_len=8192,
                quantization="bitsandbytes",
                load_format="bitsandbytes",
                dtype="bfloat16",
                trust_remote_code=True,
                gpu_memory_utilization=0.45,  # half GPU — leave room for compiled model
                enforce_eager=True,
            )
            self._needs_swap = True
        self._swapping = False

    @modal.method()
    def chat(self, messages: list[dict], max_tokens: int = 6144, temperature: float = 0.3) -> dict:
        """Run chat completion and return a plain dict."""
        import time
        from vllm import SamplingParams
        from transformers import AutoTokenizer

        MAX_CTX = 8192
        RESERVED_OUTPUT = 512  # minimum output tokens to keep

        start = time.time()
        try:
            # If mid-swap, wait briefly for it to finish rather than rejecting
            if self._swapping:
                import time as _tw
                for _ in range(10):  # wait up to 5 seconds
                    _tw.sleep(0.5)
                    if not self._swapping:
                        break

            tokenizer = AutoTokenizer.from_pretrained(TXGEMMA_MODEL)
            prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

            # Count input tokens and cap output to fit context window
            input_ids = tokenizer.encode(prompt)
            input_len = len(input_ids)
            available = MAX_CTX - input_len
            if available < RESERVED_OUTPUT:
                # Shouldn't happen (call_txgemma summarizes upstream), but safety fallback
                available = RESERVED_OUTPUT
                print(f"[TxGemma] WARNING: input {input_len} tokens exceeds budget, capping output to {available}")
            effective_max_tokens = min(max_tokens, available)
            print(f"[TxGemma] Input: {input_len} tokens, max_output: {effective_max_tokens}")

            params = SamplingParams(max_tokens=effective_max_tokens, temperature=temperature)
            outputs = self.llm.generate([prompt], params)
            text = _format_markdown_headers(outputs[0].outputs[0].text)

            latency_ms = int((time.time() - start) * 1000)
            print(f"[TxGemma] {latency_ms}ms | {len(text)} chars\n{text}")

            # After first response, swap to compiled model in background
            if self._needs_swap:
                self._needs_swap = False
                import threading
                def _background_swap():
                    try:
                        from vllm import LLM as _LLM
                        print("[TxGemma] Background: building compiled 8-bit model...")
                        compiled_llm = _LLM(
                            model=TXGEMMA_MODEL,
                            max_model_len=8192,
                            quantization="bitsandbytes",
                            load_format="bitsandbytes",
                            dtype="bfloat16",
                            trust_remote_code=True,
                            gpu_memory_utilization=0.45,
                        )
                        # Swap: briefly reject requests, replace model, resume
                        self._swapping = True
                        import time as _t
                        _t.sleep(1)
                        old = self.llm
                        self.llm = compiled_llm
                        del old
                        import torch
                        torch.cuda.empty_cache()
                        # Save compile cache to volume for future containers
                        compile_cache_volume.commit()
                        self._swapping = False
                        print("[TxGemma] Swap complete — now serving compiled 8-bit model, cache saved")
                    except Exception as ex:
                        self._swapping = False
                        print(f"[TxGemma] Background swap failed: {ex}")
                threading.Thread(target=_background_swap, daemon=True).start()

            return {
                "model_id": "txgemma-27b-chat",
                "display_name": "TxGemma-27B-Chat",
                "text": text,
                "latency_ms": latency_ms,
                "error": None,
                "meta": {},
            }
        except Exception as e:
            latency_ms = int((time.time() - start) * 1000)
            print(f"[TxGemma] ERROR {latency_ms}ms | {e}")
            return {
                "model_id": "txgemma-27b-chat",
                "display_name": "TxGemma-27B-Chat",
                "text": None,
                "latency_ms": latency_ms,
                "error": str(e),
                "meta": {},
            }


# ---------------------------------------------------------------------------
# Biomni inference function (stub — CPU)
# ---------------------------------------------------------------------------

# Biomni image — agent framework that calls LLM APIs, no GPU needed
biomni_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "build-essential")
    .pip_install(
        "biomni",
        "langchain-openai",
        "langchain-core",
        "pandas",
        "tqdm",
        "biopython",
        "PyPDF2",
        "beautifulsoup4",
    )
    .env({"PYTHONPATH": "/root"})
    .run_commands(
        "python -c \"from biomni.utils import download_and_unzip; download_and_unzip('https://biomni-release.s3.amazonaws.com/biomni_data_0.0.1.zip', '/opt/biomni')\"",
        "ls -la /opt/biomni/biomni_data/ && ls /opt/biomni/biomni_data/data_lake/ | head -5 && ls /opt/biomni/biomni_data/benchmark/ | head -5",
    )
)


biomni_volume = modal.Volume.from_name("biomni-data", create_if_missing=True)
BIOMNI_DATA_PATH = "/opt/biomni_runtime"

@app.function(
    image=biomni_image,
    secrets=[modal.Secret.from_name("workshop-secrets")],
    volumes={BIOMNI_DATA_PATH: biomni_volume},
    timeout=600,
    scaledown_window=1800,
)
def biomni_predict(prompt: str, run_id: str = "") -> dict:
    """Run Biomni agent — uses OpenAI API via langchain, no local GPU needed."""
    import os
    import sys
    import time
    import types

    # Patch anthropic dependencies to use OpenAI instead (we don't have an Anthropic key)
    if "anthropic" not in sys.modules:
        from openai import OpenAI as _OpenAI

        class _FakeAnthropicMessage:
            def __init__(self, text):
                self.content = [types.SimpleNamespace(text=text)]

        class _FakeAnthropic:
            """Routes Anthropic API calls to OpenAI GPT-4.1-mini instead."""
            def __init__(self, api_key=None, **kwargs):
                self._client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            class messages:
                pass

            def __getattr__(self, name):
                if name == "messages":
                    return self
                raise AttributeError(name)

            def create(self, model=None, system=None, max_tokens=1000, messages=None, **kwargs):
                print(f"[Biomni] Rerouting Anthropic call to GPT-4.1-mini")
                oai_messages = []
                if system:
                    oai_messages.append({"role": "system", "content": system})
                if messages:
                    oai_messages.extend(messages)
                resp = self._client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=oai_messages,
                    max_tokens=max_tokens,
                )
                return _FakeAnthropicMessage(resp.choices[0].message.content)

        mock_anthropic = types.ModuleType("anthropic")
        mock_anthropic.Anthropic = _FakeAnthropic
        sys.modules["anthropic"] = mock_anthropic

    if "langchain_anthropic" not in sys.modules:
        from langchain_openai import ChatOpenAI as _ChatOpenAI

        class _FakeChatAnthropic(_ChatOpenAI):
            """Routes langchain ChatAnthropic to ChatOpenAI with GPT-4.1-mini."""
            def __init__(self, *args, **kwargs):
                print(f"[Biomni] Rerouting ChatAnthropic to GPT-4.1-mini")
                kwargs.pop("model", None)
                kwargs.pop("max_tokens", None)
                super().__init__(model="gpt-4.1-mini", *args, **kwargs)

        mock_lc_anthropic = types.ModuleType("langchain_anthropic")
        mock_lc_anthropic.ChatAnthropic = _FakeChatAnthropic
        sys.modules["langchain_anthropic"] = mock_lc_anthropic

    def _clean_biomni_output(raw) -> str:
        """Extract clean text from Biomni's raw agent output."""
        import re

        # Handle tuple/list results — take the last element (usually the final solution)
        if isinstance(raw, (list, tuple)):
            raw = raw[-1] if raw else ""
        text = str(raw)

        # Unescape literal \n if present (repr-style strings)
        if "\\n" in text and "\n" not in text:
            text = text.replace("\\n", "\n")

        # Extract content from last <solution> block if present
        solution_matches = re.findall(r'<solution>(.*?)</solution>', text, re.DOTALL)
        if solution_matches:
            text = solution_matches[-1].strip()

        # Remove reasoning preamble
        text = re.sub(r'^(?:Thinking and reasoning|Reasoning):.*?\n\n', '', text, flags=re.DOTALL)

        # Remove "A proposed answer:" line
        text = re.sub(r'^A proposed answer:\s*\n?', '', text, flags=re.MULTILINE)

        # Remove all checklist lines — numbered or unnumbered, any bracket content
        # Matches: "1. [ ] task", "1. [✓] task (completed)", "[ ] task", etc.
        text = re.sub(r'^[ \t]*\d*\.?\s*\[[ ✓✗xX.]*\][^\n]*(?:\(completed\))?[ \t]*$', '', text, flags=re.MULTILINE)

        # Remove "Updated plan:" headers
        text = re.sub(r'^Updated plan:\s*$', '', text, flags=re.MULTILINE)

        # Remove "Proceeding with step..." lines
        text = re.sub(r'^Proceeding with (?:step|Step).*$', '', text, flags=re.MULTILINE)

        # Remove Human/Ai Message headers
        text = re.sub(r'={5,}\s*(Human|Ai)\s*Message\s*={5,}', '', text)

        # Remove <execute>...</execute> blocks
        text = re.sub(r'<execute>.*?</execute>', '', text, flags=re.DOTALL)
        # Remove <observation>...</observation> blocks
        text = re.sub(r'<observation>.*?</observation>', '', text, flags=re.DOTALL)
        # Remove remaining XML-style tags
        text = re.sub(r'</?(?:solution|execute|observation|final)>', '', text)

        # Convert bullet characters to markdown dashes
        text = re.sub(r'^[ \t]*[•◦▪][ \t]*', '- ', text, flags=re.MULTILINE)

        text = _format_markdown_headers(text)

        # Clean up excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Remove leading/trailing whitespace on each line
        text = '\n'.join(line.rstrip() for line in text.split('\n'))

        return text.strip()

    # Copy baked-in data to volume if not already there (first run only)
    biomni_marker = os.path.join(BIOMNI_DATA_PATH, "biomni_data", "data_lake", "omim.parquet")
    if not os.path.exists(biomni_marker):
        import shutil
        src = "/opt/biomni/biomni_data"
        dst = os.path.join(BIOMNI_DATA_PATH, "biomni_data")
        if os.path.isdir(src):
            print("[Biomni] Copying baked-in data to volume...")
            shutil.copytree(src, dst, dirs_exist_ok=True)
            biomni_volume.commit()
            print("[Biomni] Data copied to volume.")

    import re as _re
    import io
    import json as _json_mod

    # Use a Modal Dict for cross-container communication (shared key-value store)
    biomni_dict = modal.Dict.from_name("biomni-status", create_if_missing=True)

    def _write_intermediate(data: dict):
        """Write intermediate result to shared dict for polling."""
        try:
            biomni_dict[run_id] = _json_mod.dumps(data)
        except Exception as ex:
            print(f"[Biomni] Failed to write intermediate: {ex}")

    class _SolutionCapture(io.TextIOBase):
        """Captures stdout and extracts intermediate progress from Biomni's multi-step agent."""
        def __init__(self, original_stdout):
            self._original = original_stdout
            self._buffer = ""
            self._ai_messages_seen = 0
            self._last_text = ""
            self._start = time.time()

        def write(self, text):
            self._original.write(text)
            self._buffer += text

            if not run_id:
                return len(text)

            # Count Ai Message blocks as progress steps
            ai_msgs = _re.findall(r'={10,}\s*Ai\s*Message\s*={10,}(.*?)(?=={10,}\s*(?:Human|Ai)\s*Message|<execute>|$)', self._buffer, _re.DOTALL)
            if len(ai_msgs) > self._ai_messages_seen:
                self._ai_messages_seen = len(ai_msgs)

                # Check for <solution> blocks first
                solutions = _re.findall(r'<solution>(.*?)</solution>', self._buffer, _re.DOTALL)

                latency_ms = int((time.time() - self._start) * 1000)

                if solutions:
                    # Got a solution — show cleaned content
                    cleaned = _clean_biomni_output(solutions[-1])
                    if cleaned:
                        _write_intermediate({
                            "model_id": "biomni",
                            "display_name": "Biomni",
                            "text": cleaned,
                            "latency_ms": latency_ms,
                            "error": None,
                            "status": "running",
                            "meta": {"step": self._ai_messages_seen},
                        })
                else:
                    # No solution yet — show full text of all AI messages with light cleanup
                    def _light_clean(msg_text: str) -> str:
                        t = msg_text.strip()
                        # Remove Ai/Human Message headers
                        t = _re.sub(r'={5,}\s*(Human|Ai)\s*Message\s*={5,}', '', t)
                        # Remove <execute>...</execute> and <observation>...</observation> blocks
                        t = _re.sub(r'<execute>.*?</execute>', '', t, flags=_re.DOTALL)
                        t = _re.sub(r'<observation>.*?</observation>', '', t, flags=_re.DOTALL)
                        # Remove XML tags but keep content
                        t = _re.sub(r'</?(?:solution|execute|observation|final)>', '', t)
                        # Normalize checklist markers: [✓] → [x], [ ] stays
                        t = _re.sub(r'\[✓\]', '[x]', t)
                        t = _re.sub(r'\[✗\]', '[ ]', t)
                        # Ensure each numbered checklist item starts on its own line
                        t = _re.sub(r'(?<!\n)(\d+\.\s*\[[ x]\])', r'\n\1', t)
                        # Ensure a blank line before the first checklist item (separate from narrative)
                        t = _re.sub(r'([^\n])\n(\d+\.\s*\[[ x]\])', r'\1\n\n\2', t, count=1)
                        # Collapse excessive whitespace
                        t = _re.sub(r'\n{3,}', '\n\n', t)
                        return t.strip()

                    cleaned_msgs = [_light_clean(msg) for msg in ai_msgs]
                    cleaned_msgs = [m for m in cleaned_msgs if m]

                    # Deduplicate checklist blocks and renumber from 1
                    if cleaned_msgs:
                        combined = "\n\n".join(cleaned_msgs)
                        # Find all checklist blocks (consecutive numbered lines with [ ] or [x])
                        checklist_pattern = r'((?:^[ \t]*\d+\.\s*\[[ x]\][^\n]*\n?)+)'
                        checklists = _re.findall(checklist_pattern, combined, _re.MULTILINE)
                        if len(checklists) > 1:
                            # Keep only the last (most up-to-date) checklist, remove earlier ones
                            for cl in checklists[:-1]:
                                combined = combined.replace(cl, '', 1)
                            combined = _re.sub(r'\n{3,}', '\n\n', combined)
                        # Renumber checklist items starting from 1
                        counter = [0]
                        def _renumber(m):
                            counter[0] += 1
                            return f"{counter[0]}. [{m.group(1)}]"
                        combined = _re.sub(r'\d+\.\s*\[([ x])\]', _renumber, combined)
                        full_text = combined.strip()
                    else:
                        full_text = ""
                    if full_text and full_text != self._last_text:
                        self._last_text = full_text
                        _write_intermediate({
                            "model_id": "biomni",
                            "display_name": "Biomni",
                            "text": f"*Biomni is working (step {self._ai_messages_seen})...*\n\n{full_text}",
                            "latency_ms": latency_ms,
                            "error": None,
                            "status": "running",
                            "meta": {"step": self._ai_messages_seen},
                        })
            return len(text)

        def flush(self):
            self._original.flush()

    start = time.time()
    # Write initial "running" status
    if run_id:
        _write_intermediate({
            "model_id": "biomni",
            "display_name": "Biomni",
            "text": None,
            "latency_ms": 0,
            "error": None,
            "status": "running",
            "meta": {},
        })

    try:
        from biomni.agent import A1

        # Capture stdout to extract intermediate solutions
        capture = _SolutionCapture(sys.stdout)
        sys.stdout = capture

        agent = A1(
            path=BIOMNI_DATA_PATH,
            llm="gpt-5.4",
        )
        # Persist any files downloaded during init to volume
        biomni_volume.commit()
        print("[Biomni] Agent initialized, data committed to volume.")

        augmented_prompt = prompt + "\n\nPlease provide a concise, well-structured answer. Avoid excessive detail."
        result = agent.go(augmented_prompt)

        sys.stdout = capture._original
        latency_ms = int((time.time() - start) * 1000)
        biomni_volume.commit()

        # Extract and clean the text
        if isinstance(result, dict):
            raw = result.get("answer", result.get("output", str(result)))
        else:
            raw = str(result)
        text = _clean_biomni_output(raw)
        if not text:
            # Fallback: if parser returned empty, use raw (truncated)
            text = str(raw)[:8000]
            print(f"[Biomni] Parser returned empty, using raw text ({len(text)} chars)")

        final = {
            "model_id": "biomni",
            "display_name": "Biomni",
            "text": text,
            "latency_ms": latency_ms,
            "error": None,
            "status": "done",
            "meta": {},
        }
        # Write final result for polling
        if run_id:
            _write_intermediate(final)
            print(f"[Biomni] Final result written to dict: {len(text)} chars")

        return final
    except Exception as e:
        sys.stdout = sys.__stdout__
        latency_ms = int((time.time() - start) * 1000)
        final = {
            "model_id": "biomni",
            "display_name": "Biomni",
            "text": None,
            "latency_ms": latency_ms,
            "error": str(e),
            "status": "done",
            "meta": {},
        }
        if run_id:
            _write_intermediate(final)
            print(f"[Biomni] Error result written to dict: {e}")
        return final


# ---------------------------------------------------------------------------
# FastAPI backend (CPU, web endpoint)
# ---------------------------------------------------------------------------

@app.function(
    image=backend_image,
    volumes={DB_MOUNT_PATH: db_volume, BIOMNI_DATA_PATH: biomni_volume},
    secrets=[modal.Secret.from_name("workshop-secrets")],
    timeout=300,
    scaledown_window=1800,
)
@modal.concurrent(max_inputs=50)
@modal.asgi_app()
def backend():
    """Serve the FastAPI backend with internal calls to TxGemma and Biomni."""
    import os
    import time
    import json as _json
    from concurrent.futures import ThreadPoolExecutor, as_completed

    from fastapi import FastAPI, HTTPException, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.responses import JSONResponse

    # Import from mounted backend package (PYTHONPATH=/root, code at /root/backend/)
    from backend.services.storage import (
        clear_best_answer,
        clear_conversations,
        clear_statistics,
        conversation_exists,
        create_conversation,
        create_run,
        get_all_runs,
        get_conversation_history,
        get_detailed_stats,
        init_db,
        store_best_answer,
        store_bioreason_run,
        store_response,
        store_vote,
    )
    from backend.services.task_templates import (
        get_bioreason_example,
        get_task,
        EXAMPLE_TASKS,
        BIOREASON_EXAMPLES,
    )
    from backend.services.prompt_normalization import build_messages
    from backend.services.ranking import compute_leaderboard

    # Initialize DB on volume
    init_db()
    db_volume.commit()

    WORKSHOP_SECRET = os.getenv("WORKSHOP_SECRET", "dev-secret")
    ADMIN_PASSWORD = os.getenv("WORKSHOP_ADMIN_PASSWORD", "admin")
    BIOREASON_ENABLED = os.getenv("BIOREASON_ENABLED", "false").lower() == "true"
    BIOMNI_ENABLED = os.getenv("BIOMNI_ENABLED", "false").lower() == "true"

    # Get references to Modal functions for internal calls
    txgemma_model = TxGemmaModel()

    web_app = FastAPI(title="Biomedical Reasoning Workshop")

    # --- Middleware ---

    class SecretMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            if request.url.path == "/health":
                return await call_next(request)
            if request.headers.get("X-Workshop-Secret") != WORKSHOP_SECRET:
                return JSONResponse(status_code=403, content={"detail": "Forbidden"})
            return await call_next(request)

    web_app.add_middleware(SecretMiddleware)
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Adapter functions ---

    def call_gpt(prompt: str) -> dict:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        messages = build_messages(prompt)
        start = time.time()
        try:
            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-5.4"),
                messages=messages,
                max_completion_tokens=4096,
                temperature=0.3,
            )
            latency_ms = int((time.time() - start) * 1000)
            return {
                "model_id": "gpt-5.4",
                "display_name": "GPT-5.4",
                "text": _format_markdown_headers(response.choices[0].message.content or ""),
                "latency_ms": latency_ms,
                "error": None,
                "meta": {},
            }
        except Exception as e:
            latency_ms = int((time.time() - start) * 1000)
            return {
                "model_id": "gpt-5.4",
                "display_name": "GPT-5.4",
                "text": None,
                "latency_ms": latency_ms,
                "error": str(e),
                "meta": {},
            }

    def _summarize_for_txgemma(prompt: str, max_tokens: int = 2000) -> str:
        """Use GPT-4.1-mini to summarize a long prompt so it fits TxGemma's context."""
        from openai import OpenAI as _OAI
        client = _OAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": (
                    "You are a scientific assistant. The user's prompt (which may include conversation history) "
                    "is too long for a downstream model with limited context. Summarize it into a single, "
                    "self-contained prompt that preserves the latest question and all essential context from "
                    "prior exchanges. Keep scientific detail. Do not answer the question — just condense the prompt."
                )},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=0,
        )
        summary = response.choices[0].message.content.strip()
        print(f"[TxGemma] Summarized prompt from {len(prompt)} to {len(summary)} chars via GPT-4.1-mini")
        return summary

    def call_txgemma(prompt: str) -> dict:
        """Call TxGemma via Modal internal function. Merges system prompt into user message since TxGemma doesn't support system role."""
        import time as _time
        start = _time.time()
        try:
            # TxGemma doesn't support system role — use a custom prompt
            txgemma_system = (
                "You are an expert biomedical scientist. Provide a thorough, detailed, and complete answer. "
                "Cover all relevant aspects of the question with scientific depth. "
                "Use structured formatting with headers and bullet points. "
                "Be specific and concrete — cite specific genes, pathways, drugs, mechanisms, trial names, "
                "or data points rather than generic statements. Avoid vague filler conclusions like "
                "'more research is needed' or 'the field is rapidly evolving'. "
                "Every sentence should contain a specific fact, comparison, or actionable insight. "
                "Do not truncate your answer. You have no tool access, no search, and no internet. "
                "Answer solely from your training knowledge."
            )

            # Check if prompt is too long for TxGemma's context and summarize if needed
            # Estimate ~4 chars per token; leave room for 6144 output tokens
            full_input = txgemma_system + "\n\n" + prompt
            est_tokens = len(full_input) // 4
            max_input_tokens = 8192 - 6144  # ~2k for input, rest for output
            if est_tokens > max_input_tokens:
                print(f"[TxGemma] Prompt too long (~{est_tokens} tokens > {max_input_tokens}), summarizing...")
                prompt = _summarize_for_txgemma(prompt)

            messages = [{"role": "user", "content": txgemma_system + "\n\n" + prompt}]
            result = txgemma_model.chat.remote(messages, max_tokens=7680, temperature=0.3)
            return result
        except Exception as e:
            latency_ms = int((_time.time() - start) * 1000)
            return {
                "model_id": "txgemma-27b-chat",
                "display_name": "TxGemma-27B-Chat",
                "text": None,
                "latency_ms": latency_ms,
                "error": str(e),
                "meta": {},
            }

    def call_biomni_async(prompt: str, run_id: str) -> None:
        """Fire-and-forget Biomni via Modal spawn. Results written to volume for polling."""
        if not BIOMNI_ENABLED:
            return
        try:
            biomni_predict.spawn(prompt, run_id=run_id)
        except Exception as e:
            print(f"[Biomni] Failed to spawn: {e}")

    # --- Routes ---

    @web_app.get("/health")
    def health():
        return {"status": "ok"}

    @web_app.get("/api/config")
    def get_config():
        return {
            "bioreason_enabled": BIOREASON_ENABLED,
            "biomni_enabled": BIOMNI_ENABLED,
        }

    @web_app.get("/api/tasks")
    def get_tasks():
        return {
            "tasks": list(EXAMPLE_TASKS.values()),
            "bioreason_examples": list(BIOREASON_EXAMPLES.values()) if BIOREASON_ENABLED else [],
        }

    @web_app.post("/api/conversation")
    def new_conversation():
        conv_id = create_conversation()
        db_volume.commit()
        return {"conversation_id": conv_id}

    @web_app.get("/api/conversation/{conv_id}")
    def load_conversation(conv_id: str):
        if not conversation_exists(conv_id):
            raise HTTPException(404, "Conversation not found")
        history = get_conversation_history(conv_id)
        return {"conversation_id": conv_id, "history": history}

    @web_app.post("/api/start-run")
    def start_run(req: RunTaskRequest):
        """Create a run and return IDs immediately. Frontend then calls /api/run-model per model."""
        prompt = req.prompt
        if req.mode == "example" and req.task_id:
            task_def = get_task(req.task_id)
            if not task_def:
                raise HTTPException(404, f"Unknown task_id: {req.task_id}")
            if not prompt:
                prompt = task_def["prompt"]

        conv_id = req.conversation_id
        if not conv_id or not conversation_exists(conv_id):
            conv_id = create_conversation()

        run_id = create_run(conv_id, req.task_id, prompt, req.mode)
        db_volume.commit()
        return {"run_id": run_id, "conversation_id": conv_id, "prompt": prompt}

    @web_app.post("/api/run-model")
    def run_model(req: RunModelRequest):
        """Run a single model and return its result. Biomni runs async (use /api/poll-biomni)."""
        # Biomni is handled async — spawn and return immediately
        if req.model_id == "biomni":
            if not BIOMNI_ENABLED:
                return {
                    "model_id": "biomni",
                    "display_name": "Biomni",
                    "text": None,
                    "latency_ms": 0,
                    "error": "Biomni is disabled",
                    "status": "done",
                    "meta": {},
                }
            call_biomni_async(req.prompt, req.run_id)
            return {
                "model_id": "biomni",
                "display_name": "Biomni",
                "text": None,
                "latency_ms": 0,
                "error": None,
                "status": "running",
                "meta": {},
            }

        model_fns = {
            "gpt-5.4": call_gpt,
            "txgemma-27b-chat": call_txgemma,
        }
        fn = model_fns.get(req.model_id)
        if not fn:
            raise HTTPException(400, f"Unknown model_id: {req.model_id}")

        try:
            result = fn(req.prompt)
        except Exception as e:
            result = {
                "model_id": req.model_id,
                "display_name": req.model_id,
                "text": None,
                "latency_ms": 0,
                "error": str(e),
                "meta": {},
            }

        try:
            store_response(
                run_id=req.run_id,
                model_id=result["model_id"],
                display_name=result["display_name"],
                text=result.get("text"),
                latency_ms=result.get("latency_ms"),
                error=result.get("error"),
                meta=result.get("meta"),
            )
            db_volume.commit()
        except Exception as db_err:
            print(f"[run-model] DB storage failed (non-fatal): {db_err}")
        return result

    @web_app.post("/api/poll-biomni")
    def poll_biomni(req: PollBiomniRequest):
        """Poll for Biomni intermediate or final results."""
        import json as _j

        biomni_dict = modal.Dict.from_name("biomni-status", create_if_missing=True)

        try:
            raw = biomni_dict[req.run_id]
            result = _j.loads(raw)

            # If done, store in DB and clean up
            if result.get("status") == "done":
                try:
                    store_response(
                        run_id=req.run_id,
                        model_id=result["model_id"],
                        display_name=result["display_name"],
                        text=result.get("text"),
                        latency_ms=result.get("latency_ms"),
                        error=result.get("error"),
                        meta=result.get("meta"),
                    )
                    db_volume.commit()
                except Exception as db_err:
                    print(f"[poll-biomni] DB storage failed (non-fatal): {db_err}")
                # Clean up dict entry
                try:
                    del biomni_dict[req.run_id]
                except Exception:
                    pass

            return result
        except KeyError:
            # No result yet
            return {
                "model_id": "biomni",
                "display_name": "Biomni",
                "text": None,
                "latency_ms": 0,
                "error": None,
                "status": "running",
                "meta": {},
            }

    @web_app.post("/api/vote")
    def vote(req: VoteRequest):
        if req.vote not in ("up", "down", "none"):
            raise HTTPException(400, "vote must be 'up', 'down', or 'none'")
        store_vote(req.run_id, req.model_id, req.vote if req.vote != "none" else None, req.session_id)
        db_volume.commit()
        return {"ok": True}

    @web_app.post("/api/best-answer")
    def best_answer(req: BestAnswerRequest):
        if req.winner_model_id:
            store_best_answer(req.conversation_id, req.run_id, req.winner_model_id, req.session_id)
        else:
            clear_best_answer(req.conversation_id)
        db_volume.commit()
        return {"ok": True}

    @web_app.get("/api/leaderboard")
    def leaderboard():
        return compute_leaderboard()

    @web_app.post("/api/summarize")
    def summarize(req: SummarizeRequest):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": "Summarize the user's biomedical question in exactly 3 words. No punctuation."},
                    {"role": "user", "content": req.prompt[:500]},
                ],
                max_tokens=10,
                temperature=0,
            )
            summary = response.choices[0].message.content.strip()
            return {"summary": summary}
        except Exception as e:
            return {"summary": None, "error": str(e)}

    @web_app.post("/api/bioreason/run-example")
    def run_bioreason(req: BioReasonRequest):
        if not BIOREASON_ENABLED:
            raise HTTPException(400, "BioReason-Pro is disabled")
        example = get_bioreason_example(req.example_id)
        if not example:
            raise HTTPException(404, f"Unknown example_id: {req.example_id}")
        # BioReason integration placeholder
        return {"error": "BioReason-Pro is not yet deployed on Modal"}

    # --- Admin routes ---

    @web_app.post("/api/admin/verify")
    def admin_verify(req: AdminAction):
        if req.password != ADMIN_PASSWORD:
            raise HTTPException(403, "Invalid password")
        return {"ok": True}

    @web_app.post("/api/admin/stats")
    def admin_stats(req: AdminAction):
        if req.password != ADMIN_PASSWORD:
            raise HTTPException(403, "Invalid password")
        return get_detailed_stats()

    @web_app.post("/api/admin/history")
    def admin_history(req: AdminAction):
        if req.password != ADMIN_PASSWORD:
            raise HTTPException(403, "Invalid password")
        return {"runs": get_all_runs()}

    @web_app.post("/api/admin/clear-statistics")
    def admin_clear_statistics(req: AdminAction):
        if req.password != ADMIN_PASSWORD:
            raise HTTPException(403, "Invalid password")
        clear_statistics()
        db_volume.commit()
        return {"ok": True, "cleared": "statistics"}

    @web_app.post("/api/admin/clear-conversations")
    def admin_clear_conversations(req: AdminAction):
        if req.password != ADMIN_PASSWORD:
            raise HTTPException(403, "Invalid password")
        clear_conversations()
        db_volume.commit()
        return {"ok": True, "cleared": "conversations"}

    return web_app
