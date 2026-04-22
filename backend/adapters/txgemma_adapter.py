"""TxGemma-27B-Chat adapter via Modal-hosted vLLM (OpenAI-compatible)."""

from __future__ import annotations

import os
import time

from openai import OpenAI

from ..services.prompt_normalization import build_messages

BASE_URL = os.getenv("TXGEMMA_BASE_URL", "")
MODEL = os.getenv("TXGEMMA_MODEL", "google/txgemma-27b-chat")


def call(prompt: str) -> dict:
    if not BASE_URL:
        return {
            "model_id": "txgemma-27b-chat",
            "display_name": "TxGemma-27B-Chat",
            "text": None,
            "latency_ms": 0,
            "error": "TxGemma endpoint not configured (set TXGEMMA_BASE_URL)",
            "meta": {},
        }

    client = OpenAI(
        api_key="not-needed",
        base_url=BASE_URL,
    )
    messages = build_messages(prompt)

    start = time.time()
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=2048,
            temperature=0.3,
        )
        latency_ms = int((time.time() - start) * 1000)
        text = response.choices[0].message.content
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
