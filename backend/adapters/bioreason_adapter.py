"""BioReason-Pro adapter (optional, behind feature flag).

Integrates with the BioReason-Pro repo (https://github.com/bowang-lab/BioReason-Pro).
Only runs predefined examples with structured payloads.
Optionally uses GPT-5.4 to summarize raw output.
"""

from __future__ import annotations

import os
import time

import requests
from openai import OpenAI

BIOREASON_ENABLED = os.getenv("BIOREASON_ENABLED", "false").lower() == "true"
BIOREASON_SERVICE_URL = os.getenv("BIOREASON_SERVICE_URL", "http://localhost:8002")


def call(payload: dict) -> dict:
    if not BIOREASON_ENABLED:
        return {
            "model_id": "bioreason-pro",
            "raw_output": None,
            "clean_summary": None,
            "error": "BioReason-Pro is disabled",
            "meta": payload,
        }

    start = time.time()
    try:
        resp = requests.post(
            f"{BIOREASON_SERVICE_URL}/predict",
            json=payload,
            timeout=180,
        )
        resp.raise_for_status()
        data = resp.json()
        latency_ms = int((time.time() - start) * 1000)
        raw_output = data.get("output", data.get("prediction", ""))

        clean_summary = _summarize_with_gpt(raw_output, payload)

        return {
            "model_id": "bioreason-pro",
            "raw_output": raw_output,
            "clean_summary": clean_summary,
            "latency_ms": latency_ms,
            "error": None,
            "meta": {
                "protein_id": payload.get("protein_id"),
                "organism": payload.get("organism"),
                "sequence_length": len(payload.get("sequence", "")),
            },
        }
    except Exception as e:
        latency_ms = int((time.time() - start) * 1000)
        return {
            "model_id": "bioreason-pro",
            "raw_output": None,
            "clean_summary": None,
            "latency_ms": latency_ms,
            "error": str(e),
            "meta": payload,
        }


def _summarize_with_gpt(raw_output: str, payload: dict) -> str:
    """Use GPT-5.4 to produce a readable summary of BioReason-Pro output."""
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        protein_id = payload.get("protein_id", "unknown")
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5.4"),
            messages=[
                {
                    "role": "system",
                    "content": "Summarize the following BioReason-Pro protein function prediction in 3-5 clear sentences for a biomedical researcher.",
                },
                {
                    "role": "user",
                    "content": f"Protein: {protein_id}\n\nBioReason-Pro output:\n{raw_output}",
                },
            ],
            max_tokens=512,
            temperature=0.2,
        )
        return response.choices[0].message.content
    except Exception:
        return raw_output[:500] + ("..." if len(raw_output) > 500 else "")
