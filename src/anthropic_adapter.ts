import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { Adapter, DecomposerResponse } from "./types";

export class AnthropicAdapter implements Adapter {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = "claude-haiku-4-5-20251001") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async decompose(topic: string, breadth: number): Promise<DecomposerResponse> {
    const tmpl = readFileSync(resolve(__dirname, "..", "protocol", "decompose.prompt"), "utf-8");
    const prompt = tmpl.replace("{{BREADTH}}", String(breadth)).replace("{{TOPIC}}", topic);

    const start = Date.now();
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const end = Date.now();

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    try {
      // Basic JSON extraction if there's markdown fluff
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

      return {
        subtopics: data.subtopics.slice(0, breadth),
        metadata: {
          tokens: response.usage.input_tokens + response.usage.output_tokens,
          model: this.model,
          latency_ms: end - start,
        },
      };
    } catch (e) {
      throw new Error(`Failed to parse Anthropic response: ${e instanceof Error ? e.message : e}`);
    }
  }

  getModelName(): string {
    return this.model;
  }
}
