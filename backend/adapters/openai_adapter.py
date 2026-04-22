"""GPT-5.4 adapter via OpenAI API."""

from __future__ import annotations

import os
import time

from openai import OpenAI

from ..services.prompt_normalization import build_messages

MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4")


def call(prompt: str) -> dict:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    messages = build_messages(prompt)

    start = time.time()
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_completion_tokens=4096,
            temperature=0.3,
        )
        latency_ms = int((time.time() - start) * 1000)
        text = response.choices[0].message.content
        return {
            "model_id": "gpt-5.4",
            "display_name": "GPT-5.4",
            "text": text,
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
