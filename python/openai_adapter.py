from __future__ import annotations

import time
from pathlib import Path

import httpx

from engine import Adapter
from json_repair import extract_json
from models import DecomposerResponse, NodeMetadata


class OpenAIAdapter(Adapter):
    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        base_url: str = "https://api.openai.com/v1",
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    async def decompose(self, topic: str, breadth: int, system_prompt: str = None) -> DecomposerResponse:
        if system_prompt:
            if system_prompt in ("analytical", "action"):
                prompt_path = Path(__file__).parent / ".." / "protocol" / "prompts" / f"{system_prompt}.txt"
                tmpl = prompt_path.read_text(encoding="utf-8")
            else:
                tmpl = system_prompt
        else:
            prompt_path = Path(__file__).parent / ".." / "protocol" / "prompts" / "analytical.txt"
            tmpl = prompt_path.read_text(encoding="utf-8")

        prompt = tmpl.replace("{{BREADTH}}", str(breadth)).replace("{{TOPIC}}", topic)

        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        start_ms = _monotonic_ms()
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
        latency_ms = _monotonic_ms() - start_ms

        body = resp.json()
        text = body["choices"][0]["message"]["content"]
        usage = body.get("usage", {})
        tokens = usage.get("prompt_tokens", 0) + usage.get("completion_tokens", 0)

        data = extract_json(text)
        subtopics = data.get("subtopics", [])[:breadth]

        return DecomposerResponse(
            subtopics=subtopics,
            metadata=NodeMetadata(
                tokens=tokens,
                model=self.model,
                latency_ms=latency_ms,
            ),
        )

    def get_model_name(self) -> str:
        return self.model


def _monotonic_ms() -> int:
    return int(time.monotonic() * 1000)
