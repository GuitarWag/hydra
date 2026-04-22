from engine import Adapter
from models import DecomposerResponse, NodeMetadata

class MockAdapter(Adapter):
    def __init__(self, model_name: str = "mock-model"):
        self.model_name = model_name

    async def decompose(self, topic: str, breadth: int) -> DecomposerResponse:
        if "FailMe" in topic:
            raise Exception("Simulated failure")

        subtopics = [f"{topic} - Subtopic {i+1}" for i in range(breadth)]
        
        return DecomposerResponse(
            subtopics=subtopics,
            metadata=NodeMetadata(
                tokens=10,
                model=self.model_name,
                latency_ms=10
            )
        )

    def get_model_name(self) -> str:
        return self.model_name
