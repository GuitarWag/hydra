import asyncio
import time
import uuid
from abc import ABC, abstractmethod

from models import DecomposerResponse, HydraNode, NodeMetadata


class Adapter(ABC):
    @abstractmethod
    async def decompose(self, topic: str, breadth: int, system_prompt: str = None) -> DecomposerResponse:
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        pass


class HydraConfig:
    def __init__(
        self,
        depth_limit: int,
        branching_factor: int,
        adapter: Adapter,
        persona: str = None,
        system_prompt: str = None,
    ):
        if persona and system_prompt:
            raise ValueError("Cannot specify both persona and system_prompt")
        self.depth_limit = depth_limit
        self.branching_factor = branching_factor
        self.adapter = adapter
        self.persona = persona
        self.system_prompt = system_prompt


class HydraEngine:
    def __init__(self, config: HydraConfig):
        self.config = config
        self.resolved_system_prompt = config.system_prompt or config.persona

    async def run(self, prompt: str) -> HydraNode:
        return await self._expand(prompt, 0)

    async def _expand(self, topic: str, current_depth: int) -> HydraNode:
        node = HydraNode(
            id=str(uuid.uuid4()),
            topic=topic,
            depth=current_depth,
            metadata=NodeMetadata(
                tokens=0, model=self.config.adapter.get_model_name(), latency_ms=0
            ),
            children=[],
        )

        if current_depth >= self.config.depth_limit:
            node.status = "success"
            return node

        try:
            start_time = time.time()
            response = await self.config.adapter.decompose(
                topic, self.config.branching_factor, self.resolved_system_prompt
            )
            end_time = time.time()

            node.metadata.tokens = response.metadata.tokens
            node.metadata.latency_ms = int((end_time - start_time) * 1000)

            # FR-2: Parallel Execution with asyncio.gather
            child_tasks = [
                self._expand(subtopic, current_depth + 1) for subtopic in response.subtopics
            ]

            node.children = list(await asyncio.gather(*child_tasks))
            node.status = "success"
        except Exception:
            node.status = "failed"
            # Optional: print(f"Error expanding {topic}: {e}")

        return node
