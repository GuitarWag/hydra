import re
import time
from pathlib import Path

from anthropic import AsyncAnthropic

from engine import Adapter
from models import DecomposerResponse, NodeMetadata


class AnthropicAdapter(Adapter):
    def __init__(self, api_key: str, model: str = "claude-haiku-4-5-20251001"):
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model

    async def decompose(self, topic: str, breadth: int) -> DecomposerResponse:
        prompt_path = Path(__file__).parent / ".." / "protocol" / "decompose.prompt"
        tmpl = prompt_path.read_text(encoding="utf-8")
        prompt = tmpl.replace("{{BREADTH}}", str(breadth)).replace("{{TOPIC}}", topic)

        start_time = time.time()
        response = await self.client.messages.create(
            model=self.model, max_tokens=1024, messages=[{"role": "user", "content": prompt}]
        )
        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)

        text = response.content[0].text

        # Basic JSON extraction
        match = re.search(r"\{[\s\S]*\}", text)
        json_text = match.group(0) if match else text

        import json

        try:
            data = json.loads(json_text)
            subtopics = data.get("subtopics", [])[:breadth]

            return DecomposerResponse(
                subtopics=subtopics,
                metadata=NodeMetadata(
                    tokens=response.usage.input_tokens + response.usage.output_tokens,
                    model=self.model,
                    latency_ms=latency_ms,
                ),
            )
        except Exception as e:
            raise Exception(f"Failed to parse Anthropic response: {text}") from e

    def get_model_name(self) -> str:
        return self.model
