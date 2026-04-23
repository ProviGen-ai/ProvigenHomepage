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

class AdminAction(BaseModel):
    password: str

# ---------------------------------------------------------------------------
# Modal App & Volume
# ---------------------------------------------------------------------------

app = modal.App("biomedical-workshop")
db_volume = modal.Volume.from_name("workshop-db", create_if_missing=True)

DB_MOUNT_PATH = "/data/db"

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
    timeout=600,
    scaledown_window=1800,
    secrets=[modal.Secret.from_name("huggingface")],
)
@modal.concurrent(max_inputs=100)
class TxGemmaModel:
    @modal.enter()
    def setup(self):
        from vllm import LLM

        self.llm = LLM(
            model=TXGEMMA_MODEL,
            max_model_len=4096,
            dtype="auto",
            trust_remote_code=True,
            gpu_memory_utilization=0.90,
        )

    @modal.method()
    def chat(self, messages: list[dict], max_tokens: int = 2048, temperature: float = 0.3) -> dict:
        """Run chat completion and return a plain dict."""
        import time
        from vllm import SamplingParams
        from transformers import AutoTokenizer

        start = time.time()
        try:
            tokenizer = AutoTokenizer.from_pretrained(TXGEMMA_MODEL)
            prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

            params = SamplingParams(max_tokens=max_tokens, temperature=temperature)
            outputs = self.llm.generate([prompt], params)
            text = outputs[0].outputs[0].text

            latency_ms = int((time.time() - start) * 1000)
            print(f"[TxGemma] {latency_ms}ms | {len(text)} chars\n{text}")
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
    )
    .env({"PYTHONPATH": "/root"})
    .run_commands(
        "python -c \"from biomni.utils import download_and_unzip; download_and_unzip('https://biomni-release.s3.amazonaws.com/biomni_data_0.0.1.zip', '/opt/biomni')\"",
        "ls -la /opt/biomni/biomni_data/ && ls /opt/biomni/biomni_data/data_lake/ | head -5 && ls /opt/biomni/biomni_data/benchmark/ | head -5",
    )
)


@app.function(
    image=biomni_image,
    secrets=[modal.Secret.from_name("workshop-secrets")],
    timeout=300,
    scaledown_window=1800,
)
def biomni_predict(prompt: str) -> dict:
    """Run Biomni agent — uses OpenAI API via langchain, no local GPU needed."""
    import os
    import time

    start = time.time()
    try:
        from biomni.agent import A1

        agent = A1(
            path="/opt/biomni",
            llm="gpt-5.4",
        )
        result = agent.go(prompt)
        latency_ms = int((time.time() - start) * 1000)

        # Extract text from result (may be string or dict)
        if isinstance(result, dict):
            text = result.get("answer", result.get("output", str(result)))
        else:
            text = str(result)

        return {
            "model_id": "biomni",
            "display_name": "Biomni",
            "text": text,
            "latency_ms": latency_ms,
            "error": None,
            "meta": {},
        }
    except Exception as e:
        latency_ms = int((time.time() - start) * 1000)
        return {
            "model_id": "biomni",
            "display_name": "Biomni",
            "text": None,
            "latency_ms": latency_ms,
            "error": str(e),
            "meta": {},
        }


# ---------------------------------------------------------------------------
# FastAPI backend (CPU, web endpoint)
# ---------------------------------------------------------------------------

@app.function(
    image=backend_image,
    volumes={DB_MOUNT_PATH: db_volume},
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
                "text": response.choices[0].message.content,
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

    def call_txgemma(prompt: str) -> dict:
        """Call TxGemma via Modal internal function. Merges system prompt into user message since TxGemma doesn't support system role."""
        import time as _time
        start = _time.time()
        try:
            raw_messages = build_messages(prompt)
            # TxGemma doesn't support system role — merge into user message
            system_text = ""
            user_text = ""
            for m in raw_messages:
                if m["role"] == "system":
                    system_text += m["content"] + "\n\n"
                else:
                    user_text += m["content"]
            messages = [{"role": "user", "content": system_text + user_text}]
            result = txgemma_model.chat.remote(messages, max_tokens=2048, temperature=0.3)
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

    def call_biomni(prompt: str) -> dict:
        """Call Biomni via Modal internal function."""
        if not BIOMNI_ENABLED:
            return {
                "model_id": "biomni",
                "display_name": "Biomni",
                "text": None,
                "latency_ms": 0,
                "error": "Biomni is disabled",
                "meta": {},
            }
        try:
            result = biomni_predict.remote(prompt)
            return result
        except Exception as e:
            return {
                "model_id": "biomni",
                "display_name": "Biomni",
                "text": None,
                "latency_ms": 0,
                "error": str(e),
                "meta": {},
            }

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
        """Run a single model and return its result."""
        model_fns = {
            "gpt-5.4": call_gpt,
            "txgemma-27b-chat": call_txgemma,
            "biomni": call_biomni,
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
        return result

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
