"""Normalize prompts before sending to model adapters."""

from __future__ import annotations

SYSTEM_PROMPT = (
    "You are an expert biomedical scientist. Answer the following question concisely "
    "and precisely. Focus on scientific accuracy. Do not over-format your response "
    "with excessive markdown headers or bullet nesting."
)


def build_messages(prompt: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]
