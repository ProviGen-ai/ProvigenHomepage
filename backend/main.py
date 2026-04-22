"""FastAPI backend for the biomedical reasoning workshop."""

from dotenv import load_dotenv
load_dotenv()  # loads backend/.env automatically

import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .adapters import biomni_adapter, bioreason_adapter, openai_adapter, txgemma_adapter
from .services.ranking import compute_leaderboard
from .services.storage import (
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
from .services.task_templates import get_bioreason_example, get_task, EXAMPLE_TASKS, BIOREASON_EXAMPLES

BIOREASON_ENABLED = os.getenv("BIOREASON_ENABLED", "false").lower() == "true"
BIOMNI_ENABLED = os.getenv("BIOMNI_ENABLED", "true").lower() == "true"
WORKSHOP_SECRET = os.getenv("WORKSHOP_SECRET", "dev-secret")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Biomedical Reasoning Workshop", lifespan=lifespan)


class SecretMiddleware(BaseHTTPMiddleware):
    """Reject requests that don't carry the shared secret header."""

    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/health":
            return await call_next(request)
        if request.headers.get("X-Workshop-Secret") != WORKSHOP_SECRET:
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})
        return await call_next(request)


app.add_middleware(SecretMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request / Response models ---

class RunTaskRequest(BaseModel):
    conversation_id: Optional[str] = None
    task_id: Optional[str] = None
    prompt: str
    mode: str = "custom"  # "example" | "custom"


class VoteRequest(BaseModel):
    run_id: str
    model_id: str
    vote: str  # "up" | "down"
    session_id: Optional[str] = None


class BestAnswerRequest(BaseModel):
    conversation_id: str
    run_id: str
    winner_model_id: str
    session_id: Optional[str] = None


class BioReasonRequest(BaseModel):
    example_id: str


# --- Routes ---

@app.get("/api/config")
def get_config():
    return {
        "bioreason_enabled": BIOREASON_ENABLED,
        "biomni_enabled": BIOMNI_ENABLED,
    }


@app.get("/api/tasks")
def get_tasks():
    return {
        "tasks": list(EXAMPLE_TASKS.values()),
        "bioreason_examples": list(BIOREASON_EXAMPLES.values()) if BIOREASON_ENABLED else [],
    }


@app.post("/api/conversation")
def new_conversation():
    conv_id = create_conversation()
    return {"conversation_id": conv_id}


@app.get("/api/conversation/{conv_id}")
def load_conversation(conv_id: str):
    if not conversation_exists(conv_id):
        raise HTTPException(404, "Conversation not found")
    history = get_conversation_history(conv_id)
    return {"conversation_id": conv_id, "history": history}


@app.post("/api/run-task")
def run_task(req: RunTaskRequest):
    prompt = req.prompt
    if req.mode == "example" and req.task_id:
        task = get_task(req.task_id)
        if not task:
            raise HTTPException(404, f"Unknown task_id: {req.task_id}")
        if not prompt:
            prompt = task["prompt"]

    # Create or reuse conversation
    conv_id = req.conversation_id
    if not conv_id or not conversation_exists(conv_id):
        conv_id = create_conversation()

    run_id = create_run(conv_id, req.task_id, prompt, req.mode)

    adapters = [
        ("gpt-5.4", openai_adapter.call),
        ("txgemma-27b-chat", txgemma_adapter.call),
        ("biomni", biomni_adapter.call),
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

    # Sort by consistent model order
    order = {"gpt-5.4": 0, "txgemma-27b-chat": 1, "biomni": 2}
    responses.sort(key=lambda r: order.get(r["model_id"], 99))

    return {"run_id": run_id, "conversation_id": conv_id, "responses": responses}


@app.post("/api/vote")
def vote(req: VoteRequest):
    if req.vote not in ("up", "down", "none"):
        raise HTTPException(400, "vote must be 'up', 'down', or 'none'")
    store_vote(req.run_id, req.model_id, req.vote if req.vote != "none" else None, req.session_id)
    return {"ok": True}


@app.post("/api/best-answer")
def best_answer(req: BestAnswerRequest):
    if req.winner_model_id:
        store_best_answer(req.conversation_id, req.run_id, req.winner_model_id, req.session_id)
    else:
        clear_best_answer(req.conversation_id)
    return {"ok": True}


class SummarizeRequest(BaseModel):
    prompt: str


@app.post("/api/summarize")
def summarize(req: SummarizeRequest):
    """Generate a 3-word summary of the conversation topic using GPT-5.4-mini."""
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


@app.get("/api/leaderboard")
def leaderboard():
    return compute_leaderboard()


@app.post("/api/bioreason/run-example")
def run_bioreason(req: BioReasonRequest):
    if not BIOREASON_ENABLED:
        raise HTTPException(400, "BioReason-Pro is disabled")

    example = get_bioreason_example(req.example_id)
    if not example:
        raise HTTPException(404, f"Unknown example_id: {req.example_id}")

    result = bioreason_adapter.call(example["payload"])

    if result.get("error"):
        return result

    store_bioreason_run(
        example_id=req.example_id,
        raw_output=result.get("raw_output", ""),
        clean_summary=result.get("clean_summary", ""),
        meta=result.get("meta", {}),
    )

    return result


# --- Admin routes ---

ADMIN_PASSWORD = os.getenv("WORKSHOP_ADMIN_PASSWORD", "admin")


class AdminAction(BaseModel):
    password: str


@app.post("/api/admin/verify")
def admin_verify(req: AdminAction):
    if req.password != ADMIN_PASSWORD:
        raise HTTPException(403, "Invalid password")
    return {"ok": True}


@app.post("/api/admin/stats")
def admin_stats(req: AdminAction):
    if req.password != ADMIN_PASSWORD:
        raise HTTPException(403, "Invalid password")
    return get_detailed_stats()


@app.post("/api/admin/history")
def admin_history(req: AdminAction):
    if req.password != ADMIN_PASSWORD:
        raise HTTPException(403, "Invalid password")
    return {"runs": get_all_runs()}


@app.post("/api/admin/clear-statistics")
def admin_clear_statistics(req: AdminAction):
    if req.password != ADMIN_PASSWORD:
        raise HTTPException(403, "Invalid password")
    clear_statistics()
    return {"ok": True, "cleared": "statistics"}


@app.post("/api/admin/clear-conversations")
def admin_clear_conversations(req: AdminAction):
    if req.password != ADMIN_PASSWORD:
        raise HTTPException(403, "Invalid password")
    clear_conversations()
    return {"ok": True, "cleared": "conversations"}
