export interface HydraNode {
  id: string;
  topic: string;
  depth: number;
  children: HydraNode[];
  resolution: string | null;
  metadata: {
    tokens: number;
    model: string;
    latency_ms: number;
  };
  status?: "failed" | "success";
}

export interface DecomposerResponse {
  subtopics: string[];
  metadata: {
    tokens: number;
    model: string;
    latency_ms: number;
  };
}

export interface Adapter {
  decompose(topic: string, breadth: number, systemPrompt?: string): Promise<DecomposerResponse>;
  getModelName(): string;
}
