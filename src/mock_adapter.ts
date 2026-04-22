import { Adapter, DecomposerResponse } from "./types";

export class MockAdapter implements Adapter {
  constructor(private modelName: string = "mock-model") {}

  async decompose(topic: string, breadth: number): Promise<DecomposerResponse> {
    const subtopics = Array.from({ length: breadth }, (_, i) => `${topic} - Subtopic ${i + 1}`);
    
    return {
      subtopics,
      metadata: {
        tokens: 10,
        model: this.modelName,
        latency_ms: 10,
      },
    };
  }

  getModelName(): string {
    return this.modelName;
  }
}
