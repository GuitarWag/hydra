from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field

class NodeMetadata(BaseModel):
    tokens: int
    model: str
    latency_ms: int

class HydraNode(BaseModel):
    id: str
    topic: str
    depth: int
    children: List[HydraNode] = Field(default_factory=list)
    resolution: Optional[str] = None
    metadata: NodeMetadata
    status: Optional[str] = None

class DecomposerResponse(BaseModel):
    subtopics: List[str]
    metadata: NodeMetadata
