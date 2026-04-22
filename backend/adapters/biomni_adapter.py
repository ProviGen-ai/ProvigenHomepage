"""Biomni adapter.

Biomni is integrated from the official repo (https://github.com/snap-stanford/biomni).
This adapter wraps calls to a locally-running Biomni service or direct Python import.

If dependency conflicts exist, Biomni can be isolated behind a local HTTP service
(e.g., a small Flask/FastAPI wrapper running in its own conda env on a separate port).
"""

from __future__ import annotations

import os
import time

import requests

# If Biomni runs as a separate local service, point to it here
BIOMNI_SERVICE_URL = os.getenv("BIOMNI_SERVICE_URL", "http://localhost:8001")
BIOMNI_ENABLED = os.getenv("BIOMNI_ENABLED", "true").lower() == "true"


def call(prompt: str) -> dict:
    if not BIOMNI_ENABLED:
        return {
            "model_id": "biomni",
            "display_name": "Biomni",
            "text": None,
            "latency_ms": 0,
            "error": "Biomni is disabled",
            "meta": {},
        }

    start = time.time()
    try:
        resp = requests.post(
            f"{BIOMNI_SERVICE_URL}/predict",
            json={"prompt": prompt},
            timeout=120,
        )
        resp.raise_for_status()
        data = resp.json()
        latency_ms = int((time.time() - start) * 1000)

        answer = data.get("answer", data.get("text", ""))
        reasoning = data.get("reasoning", data.get("reasoning_summary", ""))

        return {
            "model_id": "biomni",
            "display_name": "Biomni",
            "text": answer,
            "latency_ms": latency_ms,
            "error": None,
            "meta": {
                "reasoning_summary": reasoning,
                "artifacts": data.get("artifacts", []),
            },
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
