import os

import pytest
from dotenv import load_dotenv

from anthropic_adapter import AnthropicAdapter
from engine import HydraConfig, HydraEngine

load_dotenv()


@pytest.mark.asyncio
async def test_anthropic_integration():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        pytest.skip("ANTHROPIC_API_KEY not set")

    adapter = AnthropicAdapter(api_key=api_key)

    # Pre-flight check
    try:
        await adapter.decompose("test", 1)
    except Exception as e:
        pytest.fail(f"Pre-flight API check failed: {e}")

    config = HydraConfig(
        initial_prompt="The future of sustainable energy",
        depth_limit=1,
        branching_factor=2,
        adapter=adapter,
    )
    engine = HydraEngine(config)
    root = await engine.run()

    assert root.status == "success"
    assert len(root.children) == 2
    assert "claude-haiku-4-5" in root.metadata.model
    assert root.metadata.tokens > 0
