import pytest

from engine import HydraConfig, HydraEngine
from mock_adapter import MockAdapter


@pytest.mark.asyncio
async def test_identity():
    """Identity Test: If n=0, the tree contains only the root"""
    config = HydraConfig(depth_limit=0, branching_factor=3, adapter=MockAdapter())
    engine = HydraEngine(config)
    root = await engine.run("Root")

    assert root.depth == 0
    assert len(root.children) == 0


@pytest.mark.asyncio
async def test_branching():
    """Branching Test: If n=1 and breadth=3, the tree must contain exactly 4 nodes"""
    config = HydraConfig(depth_limit=1, branching_factor=3, adapter=MockAdapter())
    engine = HydraEngine(config)
    root = await engine.run("Root")

    total_nodes = 1 + len(root.children)
    assert total_nodes == 4


@pytest.mark.asyncio
async def test_concurrency():
    """Concurrency Test: Handle concurrent expansion"""
    config = HydraConfig(depth_limit=2, branching_factor=5, adapter=MockAdapter())
    engine = HydraEngine(config)
    root = await engine.run("Root")

    assert len(root.children) == 5
    assert len(root.children[0].children) == 5


@pytest.mark.asyncio
async def test_context_propagation():
    """Context Propagation Test: Verify child nodes have access to original root topic"""
    root_topic = "Intelligence"
    config = HydraConfig(depth_limit=2, branching_factor=2, adapter=MockAdapter())
    engine = HydraEngine(config)
    root = await engine.run(root_topic)

    assert root_topic in root.children[0].topic
    assert root_topic in root.children[0].children[0].topic


@pytest.mark.asyncio
async def test_partial_failure():
    """Partial Failure Test: If one branch fails, others succeed and failed node marked"""

    class FailingAdapter(MockAdapter):
        def __init__(self):
            super().__init__()
            self.call_count = 0

        async def decompose(self, topic: str, breadth: int, system_prompt: str = ""):
            self.call_count += 1
            if self.call_count == 1:
                from models import DecomposerResponse, NodeMetadata

                return DecomposerResponse(
                    subtopics=["SuccessTopic", "FailMeTopic"],
                    metadata=NodeMetadata(tokens=10, model="test", latency_ms=10),
                )
            if "FailMe" in topic:
                raise RuntimeError("Simulated failure")
            return await super().decompose(topic, breadth, system_prompt)

    config = HydraConfig(depth_limit=2, branching_factor=2, adapter=FailingAdapter())
    engine = HydraEngine(config)
    root = await engine.run("Root")

    assert root.status == "success"
    assert len(root.children) == 2

    success_branch = next(c for c in root.children if c.topic == "SuccessTopic")
    fail_branch = next(c for c in root.children if c.topic == "FailMeTopic")

    assert success_branch.status == "success"
    assert fail_branch.status == "failed"
