from __future__ import annotations

from pydantic import BaseModel, Field


class NodeMetadata(BaseModel):
    tokens: int
    model: str
    latency_ms: int


class HydraNode(BaseModel):
    id: str
    topic: str
    depth: int
    children: list[HydraNode] = Field(default_factory=list)
    resolution: str | None = None
    metadata: NodeMetadata
    status: str | None = None


class DecomposerResponse(BaseModel):
    subtopics: list[str]
    metadata: NodeMetadata
