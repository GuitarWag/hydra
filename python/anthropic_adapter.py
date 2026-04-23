import time
from pathlib import Path

from anthropic import AsyncAnthropic

from engine import Adapter
from json_repair import extract_json
from models import DecomposerResponse, NodeMetadata


class AnthropicAdapter(Adapter):
    def __init__(self, api_key: str, model: str = "claude-haiku-4-5-20251001"):
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model

    async def decompose(self, topic: str, breadth: int, system_prompt: str = None) -> DecomposerResponse:
        if system_prompt:
            # Custom or persona
            if system_prompt in ("analytical", "action"):
                prompt_path = Path(__file__).parent / ".." / "protocol" / "prompts" / f"{system_prompt}.txt"
                tmpl = prompt_path.read_text(encoding="utf-8")
            else:
                tmpl = system_prompt
        else:
            # Default: analytical
            prompt_path = Path(__file__).parent / ".." / "protocol" / "prompts" / "analytical.txt"
            tmpl = prompt_path.read_text(encoding="utf-8")

        prompt = tmpl.replace("{{BREADTH}}", str(breadth)).replace("{{TOPIC}}", topic)

        start_ms = _monotonic_ms()
        response = await self.client.messages.create(
            model=self.model, max_tokens=1024, messages=[{"role": "user", "content": prompt}]
        )
        latency_ms = _monotonic_ms() - start_ms

        text = response.content[0].text
        data = extract_json(text)
        subtopics = data.get("subtopics", [])[:breadth]

        return DecomposerResponse(
            subtopics=subtopics,
            metadata=NodeMetadata(
                tokens=response.usage.input_tokens + response.usage.output_tokens,
                model=self.model,
                latency_ms=latency_ms,
            ),
        )

    def get_model_name(self) -> str:
        return self.model


def _monotonic_ms() -> int:
    return int(time.monotonic() * 1000)
