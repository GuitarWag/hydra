from __future__ import annotations

import json
import re


class JSONExtractionError(Exception):
    pass


def extract_json(text: str) -> dict:
    cleaned = _strip_code_fences(text)
    raw = _extract_braces(cleaned)
    return _parse_with_repairs(raw, text)


def _strip_code_fences(text: str) -> str:
    return re.sub(r"```(?:json)?\s*\n?([\s\S]*?)\n?\s*```", r"\1", text)


def _extract_braces(text: str) -> str:
    first = text.find("{")
    last = text.rfind("}")
    if first == -1 or last == -1 or last <= first:
        raise JSONExtractionError(
            f"No JSON object found in text: {text[:120]!r}"
        )
    return text[first : last + 1]


def _parse_with_repairs(raw: str, original_text: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    repaired = _fix_trailing_commas(raw)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError:
        pass

    repaired = _fix_single_quotes(repaired)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError as exc:
        raise JSONExtractionError(
            f"Failed to parse JSON after repairs: {exc}. "
            f"Original text: {original_text[:200]!r}"
        ) from exc


def _fix_trailing_commas(text: str) -> str:
    return re.sub(r",\s*([}\]])", r"\1", text)


def _fix_single_quotes(text: str) -> str:
    return re.sub(r"(?<![\\])'", '"', text)
