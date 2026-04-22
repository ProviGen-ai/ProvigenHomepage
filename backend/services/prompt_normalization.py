"""Normalize prompts before sending to model adapters."""

from __future__ import annotations

SYSTEM_PROMPT = (
    "You are an expert biomedical scientist. Answer the following question accurately "
    "and completely, but be concise — aim for the shortest answer that fully addresses "
    "the question. Avoid filler phrases, unnecessary caveats, and repetitive summaries. "
    "Use brief bullet points where helpful. Never truncate mid-sentence; always finish "
    "your thought. Do not over-format with excessive markdown headers or bullet nesting. "
    "You have no tool access, no search capabilities, and no internet access. "
    "Answer solely from your training knowledge."
)


def build_messages(prompt: str) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]
