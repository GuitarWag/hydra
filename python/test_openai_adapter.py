from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from openai_adapter import OpenAIAdapter


def _mock_response(
    subtopics: list[str],
    prompt_tokens: int = 100,
    completion_tokens: int = 50,
    status_code: int = 200,
    wrap_in_fence: bool = False,
) -> httpx.Response:
    content = json.dumps({"subtopics": subtopics})
    if wrap_in_fence:
        content = f"```json\n{content}\n```"

    body = {
        "choices": [{"message": {"content": content}}],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
        },
    }
    return httpx.Response(
        status_code=status_code,
        json=body,
        request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions"),
    )


class TestOpenAIAdapterInit:
    def test_defaults(self):
        adapter = OpenAIAdapter(api_key="sk-test")
        assert adapter.model == "gpt-4o-mini"
        assert adapter.base_url == "https://api.openai.com/v1"

    def test_custom_params(self):
        adapter = OpenAIAdapter(
            api_key="sk-test",
            model="llama3",
            base_url="http://localhost:11434/v1/",
        )
        assert adapter.model == "llama3"
        assert adapter.base_url == "http://localhost:11434/v1"

    def test_trailing_slash_stripped(self):
        adapter = OpenAIAdapter(api_key="k", base_url="http://host/v1///")
        assert adapter.base_url == "http://host/v1"

    def test_get_model_name(self):
        adapter = OpenAIAdapter(api_key="k", model="my-model")
        assert adapter.get_model_name() == "my-model"


class TestOpenAIAdapterDecompose:
    @pytest.mark.asyncio
    async def test_basic_decompose(self):
        adapter = OpenAIAdapter(api_key="sk-test")
        topics = ["Topic A", "Topic B", "Topic C"]
        mock_resp = _mock_response(topics)

        with patch("openai_adapter.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_resp)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await adapter.decompose("test topic", 3)

        assert result.subtopics == topics
        assert result.metadata.model == "gpt-4o-mini"
        assert result.metadata.tokens == 150
        assert result.metadata.latency_ms >= 0

    @pytest.mark.asyncio
    async def test_breadth_truncation(self):
        adapter = OpenAIAdapter(api_key="sk-test")
        topics = ["A", "B", "C", "D", "E"]
        mock_resp = _mock_response(topics)

        with patch("openai_adapter.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_resp)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await adapter.decompose("topic", 3)

        assert len(result.subtopics) == 3

    @pytest.mark.asyncio
    async def test_handles_code_fenced_response(self):
        adapter = OpenAIAdapter(api_key="sk-test")
        mock_resp = _mock_response(["X", "Y"], wrap_in_fence=True)

        with patch("openai_adapter.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_resp)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await adapter.decompose("topic", 2)

        assert result.subtopics == ["X", "Y"]

    @pytest.mark.asyncio
    async def test_sends_correct_request(self):
        adapter = OpenAIAdapter(
            api_key="sk-secret",
            model="gpt-4o",
            base_url="https://custom.api.com/v1",
        )
        mock_resp = _mock_response(["A"])

        with patch("openai_adapter.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_resp)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            await adapter.decompose("my topic", 1)

        call_args = mock_client.post.call_args
        assert call_args[0][0] == "https://custom.api.com/v1/chat/completions"
        headers = call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer sk-secret"
        assert headers["Content-Type"] == "application/json"
        payload = call_args[1]["json"]
        assert payload["model"] == "gpt-4o"
        assert payload["max_tokens"] == 1024
        assert "my topic" in payload["messages"][0]["content"]

    @pytest.mark.asyncio
    async def test_missing_usage_defaults_to_zero(self):
        adapter = OpenAIAdapter(api_key="sk-test")
        body = {
            "choices": [{"message": {"content": '{"subtopics": ["a"]}'}}],
        }
        mock_resp = httpx.Response(
            status_code=200,
            json=body,
            request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions"),
        )

        with patch("openai_adapter.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_resp)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await adapter.decompose("topic", 1)

        assert result.metadata.tokens == 0

    @pytest.mark.asyncio
    async def test_http_error_propagates(self):
        adapter = OpenAIAdapter(api_key="sk-test")
        mock_resp = httpx.Response(
            status_code=401,
            json={"error": {"message": "Invalid API key"}},
            request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions"),
        )

        with patch("openai_adapter.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_resp)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            with pytest.raises(httpx.HTTPStatusError):
                await adapter.decompose("topic", 1)


class TestOpenAIAdapterWithEngine:
    @pytest.mark.asyncio
    async def test_engine_integration(self):
        from engine import HydraConfig, HydraEngine

        adapter = OpenAIAdapter(api_key="sk-test")
        mock_resp = _mock_response(["Sub A", "Sub B"])

        with patch("openai_adapter.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_resp)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            config = HydraConfig(
                depth_limit=1,
                branching_factor=2,
                adapter=adapter,
            )
            engine = HydraEngine(config)
            root = await engine.run("test")

        assert root.status == "success"
        assert len(root.children) == 2
        assert root.children[0].topic == "Sub A"
        assert root.children[1].topic == "Sub B"
