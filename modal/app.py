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

from __future__ import annotations

import modal

# ---------------------------------------------------------------------------
# Modal App & Volume
# ---------------------------------------------------------------------------

app = modal.App("biomedical-workshop")
db_volume = modal.Volume.from_name("workshop-db", create_if_missing=True)

DB_MOUNT_PATH = "/data/db"

# ---------------------------------------------------------------------------
# Images
# ---------------------------------------------------------------------------

# Backend code mount — includes the backend package
backend_mount = modal.Mount.from_local_dir(
    local_path="../backend",
    remote_path="/root/backend",
    condition=lambda path: "__pycache__" not in path and not path.endswith(".db"),
)

# Backend image — lightweight, no GPU deps
backend_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi>=0.115.0",
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
    )
)


# ---------------------------------------------------------------------------
# TxGemma inference function (GPU)
# ---------------------------------------------------------------------------

@app.cls(
    image=txgemma_image,
    gpu=modal.gpu.A100(count=1, size="80GB"),
    timeout=600,
    container_idle_timeout=1800,
    allow_concurrent_inputs=100,
)
class TxGemmaModel:
    @modal.enter()
    def setup(self):
        from vllm import AsyncLLMEngine
        from vllm.engine.arg_utils import AsyncEngineArgs

        engine_args = AsyncEngineArgs(
            model=TXGEMMA_MODEL,
            max_model_len=4096,
            dtype="auto",
            trust_remote_code=True,
            gpu_memory_utilization=0.90,
        )
        self.engine = AsyncLLMEngine.from_engine_args(engine_args)
        self._chat_serving = None

    async def _get_chat_serving(self):
        if self._chat_serving is None:
            from vllm.entrypoints.openai.serving_chat import OpenAIServingChat
            from vllm.entrypoints.openai.serving_engine import BaseModelPath

            model_config = await self.engine.get_model_config()
            self._chat_serving = OpenAIServingChat(
                engine_client=self.engine,
                model_config=model_config,
                base_model_paths=[BaseModelPath(name=TXGEMMA_MODEL, model_path=TXGEMMA_MODEL)],
                response_role="assistant",
            )
        return self._chat_serving

    @modal.method()
    async def chat(self, messages: list[dict], max_tokens: int = 2048, temperature: float = 0.3) -> dict:
        """Run chat completion and return a plain dict (serializable)."""
        import time
        from vllm.entrypoints.openai.protocol import ChatCompletionRequest

        start = time.time()
        try:
            serving = await self._get_chat_serving()
            request = ChatCompletionRequest(
                model=TXGEMMA_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            response = await serving.create_chat_completion(request)

            # response is a ChatCompletionResponse or JSONResponse
            if hasattr(response, "body"):
                import json as _json
                body = _json.loads(response.body.decode())
            else:
                body = response

            latency_ms = int((time.time() - start) * 1000)
            text = body["choices"][0]["message"]["content"]
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

@app.function(image=backend_image, timeout=180)
def biomni_predict(prompt: str) -> dict:
    """Biomni stub — returns a placeholder until the actual model is integrated.

    To integrate the real Biomni:
    1. Create a biomni_image with its dependencies
    2. Download the model weights at build time
    3. Replace this stub with actual inference
    """
    return {
        "model_id": "biomni",
        "display_name": "Biomni",
        "text": None,
        "latency_ms": 0,
        "error": "Biomni is not yet deployed on Modal. Integration pending.",
        "meta": {},
    }


# ---------------------------------------------------------------------------
# FastAPI backend (CPU, web endpoint)
# ---------------------------------------------------------------------------

@app.function(
    image=backend_image,
    mounts=[backend_mount],
    volumes={DB_MOUNT_PATH: db_volume},
    secrets=[modal.Secret.from_name("workshop-secrets")],
    timeout=300,
    container_idle_timeout=1800,
    allow_concurrent_inputs=50,
)
@modal.asgi_app()
def backend():
    """Serve the FastAPI backend with internal calls to TxGemma and Biomni."""
    import os
    import time
    import json as _json
    from concurrent.futures import ThreadPoolExecutor, as_completed

    from fastapi import FastAPI, HTTPException, Request
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.responses import JSONResponse
    from typing import Optional

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

    # --- Request models ---

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

    class AdminAction(BaseModel):
        password: str

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
        """Call TxGemma via Modal internal function."""
        try:
            messages = build_messages(prompt)
            result = txgemma_model.chat.remote(messages, max_tokens=2048, temperature=0.3)
            return result
        except Exception as e:
            return {
                "model_id": "txgemma-27b-chat",
                "display_name": "TxGemma-27B-Chat",
                "text": None,
                "latency_ms": 0,
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

    @web_app.post("/api/run-task")
    def run_task(req: RunTaskRequest):
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

        adapters = [
            ("gpt-5.4", call_gpt),
            ("txgemma-27b-chat", call_txgemma),
            ("biomni", call_biomni),
        ]

        responses = []
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {executor.submit(fn, prompt): mid for mid, fn in adapters}
            for future in as_completed(futures):
                try:
                    result = future.result(timeout=180)
                except Exception as e:
                    model_id = futures[future]
                    result = {
                        "model_id": model_id,
                        "display_name": model_id,
                        "text": None,
                        "latency_ms": 0,
                        "error": str(e),
                        "meta": {},
                    }
                store_response(
                    run_id=run_id,
                    model_id=result["model_id"],
                    display_name=result["display_name"],
                    text=result.get("text"),
                    latency_ms=result.get("latency_ms"),
                    error=result.get("error"),
                    meta=result.get("meta"),
                )
                responses.append(result)

        order = {"gpt-5.4": 0, "txgemma-27b-chat": 1, "biomni": 2}
        responses.sort(key=lambda r: order.get(r["model_id"], 99))

        db_volume.commit()
        return {"run_id": run_id, "conversation_id": conv_id, "responses": responses}

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
