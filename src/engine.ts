import { randomUUID } from "node:crypto";
import { HydraResult } from "./traverse";
import type { Adapter, HydraNode } from "./types";

export interface HydraConfig {
  depthLimit: number;
  branchingFactor: number;
  adapter: Adapter;
  persona?: "analytical" | "action";
  systemPrompt?: string;
}

export class HydraEngine {
  private resolvedSystemPrompt: string | undefined;

  constructor(private config: HydraConfig) {
    // Validate: can't have both
    if (this.config.persona && this.config.systemPrompt) {
      throw new Error("Cannot specify both persona and systemPrompt");
    }
    this.resolvedSystemPrompt = this.config.systemPrompt || this.config.persona;
  }

  async run(prompt: string): Promise<HydraResult> {
    return new HydraResult(await this.expand(prompt, 0));
  }

  private async expand(topic: string, currentDepth: number): Promise<HydraNode> {
    const node: HydraNode = {
      id: randomUUID(),
      topic,
      depth: currentDepth,
      children: [],
      resolution: null,
      metadata: {
        tokens: 0,
        model: this.config.adapter.getModelName(),
        latency_ms: 0,
      },
    };

    if (currentDepth >= this.config.depthLimit) {
      node.status = "success";
      return node;
    }

    try {
      const start = Date.now();
      const response = await this.config.adapter.decompose(
        topic,
        this.config.branchingFactor,
        this.resolvedSystemPrompt,
      );
      const end = Date.now();

      node.metadata.tokens = response.metadata.tokens;
      node.metadata.latency_ms = end - start;

      const childPromises = response.subtopics.map((subtopic) =>
        this.expand(subtopic, currentDepth + 1),
      );

      // FR-4.2: Partial Failure handling
      // We use Promise.all and allow individual expand calls to handle their own errors
      node.children = await Promise.all(childPromises);
      node.status = node.children.some((c) => c.status === "failed") ? "success" : "success";
      // Actually, if we got here, the decomposition succeeded.
      // Individual children will have their own status.
      node.status = "success";
    } catch {
      node.status = "failed";
    }

    return node;
  }
}
