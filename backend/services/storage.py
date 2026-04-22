"""SQLite storage layer."""

from __future__ import annotations

import json
import sqlite3
import uuid
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent.parent / "db"
DB_PATH = DB_DIR / "app.db"
SCHEMA_PATH = DB_DIR / "schema.sql"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    with open(SCHEMA_PATH) as f:
        conn.executescript(f.read())
    conn.close()


def create_conversation() -> str:
    conv_id = uuid.uuid4().hex[:8]
    conn = get_connection()
    conn.execute("INSERT INTO conversations (id) VALUES (?)", (conv_id,))
    conn.commit()
    conn.close()
    return conv_id


def conversation_exists(conv_id: str) -> bool:
    conn = get_connection()
    row = conn.execute("SELECT 1 FROM conversations WHERE id = ?", (conv_id,)).fetchone()
    conn.close()
    return row is not None


def create_run(conversation_id: str, task_id: str | None, prompt: str, mode: str) -> str:
    run_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute(
        "INSERT INTO runs (id, conversation_id, task_id, prompt, mode) VALUES (?, ?, ?, ?, ?)",
        (run_id, conversation_id, task_id, prompt, mode),
    )
    conn.commit()
    conn.close()
    return run_id


def get_conversation_history(conv_id: str) -> list:
    conn = get_connection()
    runs = conn.execute(
        "SELECT id, task_id, prompt, mode, created_at FROM runs WHERE conversation_id = ? ORDER BY created_at",
        (conv_id,),
    ).fetchall()

    history = []
    for run in runs:
        responses = conn.execute(
            "SELECT model_id, display_name, text, latency_ms, error, meta_json FROM responses WHERE run_id = ? ORDER BY model_id",
            (run["id"],),
        ).fetchall()

        best = conn.execute(
            "SELECT winner_model_id FROM best_answers WHERE run_id = ? ORDER BY created_at DESC LIMIT 1",
            (run["id"],),
        ).fetchone()

        votes = conn.execute(
            "SELECT model_id, vote FROM votes WHERE run_id = ?",
            (run["id"],),
        ).fetchall()

        history.append({
            "run_id": run["id"],
            "task_id": run["task_id"],
            "prompt": run["prompt"],
            "mode": run["mode"],
            "created_at": run["created_at"],
            "responses": [
                {
                    "model_id": r["model_id"],
                    "display_name": r["display_name"],
                    "text": r["text"],
                    "latency_ms": r["latency_ms"],
                    "error": r["error"],
                    "meta": json.loads(r["meta_json"]) if r["meta_json"] else {},
                }
                for r in responses
            ],
            "best_model": best["winner_model_id"] if best else None,
            "votes": {v["model_id"]: v["vote"] for v in votes},
        })

    conn.close()
    return history


def store_response(
    run_id: str,
    model_id: str,
    display_name: str,
    text: str | None,
    latency_ms: int | None,
    error: str | None,
    meta: dict | None,
):
    resp_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute(
        "INSERT INTO responses (id, run_id, model_id, display_name, text, latency_ms, error, meta_json) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (resp_id, run_id, model_id, display_name, text, latency_ms, error, json.dumps(meta or {})),
    )
    conn.commit()
    conn.close()
    return resp_id


def store_vote(run_id: str, model_id: str, vote: str | None, session_id: str | None = None):
    """Store or update a vote. If vote is None, remove the existing vote."""
    conn = get_connection()
    # Remove any existing vote for this session+run+model
    conn.execute(
        "DELETE FROM votes WHERE run_id = ? AND model_id = ? AND session_id = ?",
        (run_id, model_id, session_id),
    )
    if vote is not None:
        vote_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO votes (id, run_id, model_id, vote, session_id) VALUES (?, ?, ?, ?, ?)",
            (vote_id, run_id, model_id, vote, session_id),
        )
    conn.commit()
    conn.close()


def store_best_answer(run_id: str, winner_model_id: str, session_id: str | None = None):
    ba_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute(
        "INSERT INTO best_answers (id, run_id, winner_model_id, session_id) VALUES (?, ?, ?, ?)",
        (ba_id, run_id, winner_model_id, session_id),
    )
    conn.commit()
    conn.close()
    return ba_id


def store_bioreason_run(example_id: str, raw_output: str, clean_summary: str, meta: dict):
    run_id = str(uuid.uuid4())
    conn = get_connection()
    conn.execute(
        "INSERT INTO bioreason_runs (id, example_id, raw_output, clean_summary, meta_json) "
        "VALUES (?, ?, ?, ?, ?)",
        (run_id, example_id, raw_output, clean_summary, json.dumps(meta)),
    )
    conn.commit()
    conn.close()
    return run_id


def _get_stats_cutoff() -> str | None:
    conn = get_connection()
    row = conn.execute("SELECT value FROM settings WHERE key = 'stats_cleared_at'").fetchone()
    conn.close()
    return row["value"] if row else None


def get_leaderboard() -> dict:
    conn = get_connection()
    cutoff = _get_stats_cutoff()
    time_filter = f"AND r.created_at > '{cutoff}'" if cutoff else ""
    time_filter_direct = f"WHERE created_at > '{cutoff}'" if cutoff else ""

    total_runs = conn.execute(
        f"SELECT COUNT(*) FROM runs r WHERE 1=1 {time_filter}"
    ).fetchone()[0]

    wins = conn.execute(
        f"SELECT winner_model_id, COUNT(*) as cnt FROM best_answers "
        f"{time_filter_direct} GROUP BY winner_model_id"
    ).fetchall()

    upvotes = conn.execute(
        f"SELECT model_id, COUNT(*) as cnt FROM votes WHERE vote='up' "
        f"{'AND created_at > ' + repr(cutoff) if cutoff else ''} GROUP BY model_id"
    ).fetchall()

    downvotes = conn.execute(
        f"SELECT model_id, COUNT(*) as cnt FROM votes WHERE vote='down' "
        f"{'AND created_at > ' + repr(cutoff) if cutoff else ''} GROUP BY model_id"
    ).fetchall()

    avg_latency = conn.execute(
        f"SELECT resp.model_id, AVG(resp.latency_ms) as avg_ms FROM responses resp "
        f"JOIN runs r ON resp.run_id = r.id WHERE resp.latency_ms IS NOT NULL {time_filter} "
        f"GROUP BY resp.model_id"
    ).fetchall()

    conn.close()

    return {
        "total_runs": total_runs,
        "wins_per_model": {r["winner_model_id"]: r["cnt"] for r in wins},
        "upvotes_per_model": {r["model_id"]: r["cnt"] for r in upvotes},
        "downvotes_per_model": {r["model_id"]: r["cnt"] for r in downvotes},
        "avg_latency_ms_per_model": {r["model_id"]: round(r["avg_ms"], 1) for r in avg_latency},
    }


def get_detailed_stats() -> dict:
    conn = get_connection()
    basic = get_leaderboard()
    cutoff = _get_stats_cutoff()
    time_filter = f"WHERE created_at > '{cutoff}'" if cutoff else ""

    total_conversations = conn.execute(
        f"SELECT COUNT(*) FROM conversations {time_filter}"
    ).fetchone()[0]

    total_votes = conn.execute(
        f"SELECT COUNT(*) FROM votes {time_filter}"
    ).fetchone()[0]

    total_best = conn.execute(
        f"SELECT COUNT(*) FROM best_answers {time_filter}"
    ).fetchone()[0]

    recent_runs = conn.execute(
        f"SELECT r.id, r.task_id, r.prompt, r.mode, r.created_at, r.conversation_id "
        f"FROM runs r {time_filter.replace('created_at', 'r.created_at')} "
        f"ORDER BY r.created_at DESC LIMIT 8"
    ).fetchall()

    conn.close()

    return {
        **basic,
        "total_conversations": total_conversations,
        "total_votes": total_votes,
        "total_best_answers": total_best,
        "stats_cleared_at": cutoff,
        "recent_runs": [
            {
                "id": r["id"],
                "task_id": r["task_id"],
                "prompt": r["prompt"][:200],
                "mode": r["mode"],
                "created_at": r["created_at"],
                "conversation_id": r["conversation_id"],
            }
            for r in recent_runs
        ],
    }


def clear_statistics():
    """Set a cutoff timestamp — all stats queries ignore data before this point."""
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('stats_cleared_at', datetime('now'))"
    )
    conn.commit()
    conn.close()


def clear_conversations():
    conn = get_connection()
    conn.execute("DELETE FROM bioreason_runs")
    conn.execute("DELETE FROM best_answers")
    conn.execute("DELETE FROM votes")
    conn.execute("DELETE FROM responses")
    conn.execute("DELETE FROM runs")
    conn.execute("DELETE FROM conversations")
    conn.commit()
    conn.close()
