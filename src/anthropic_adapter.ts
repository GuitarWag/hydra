import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "./json_repair";
import type { Adapter, DecomposerResponse } from "./types";

export class AnthropicAdapter implements Adapter {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = "claude-haiku-4-5-20251001") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async decompose(topic: string, breadth: number, systemPrompt?: string): Promise<DecomposerResponse> {
    let tmpl: string;
    if (systemPrompt) {
      // Custom or persona-mapped prompt
      const promptFile = systemPrompt === "analytical" || systemPrompt === "action"
        ? `prompts/${systemPrompt}.txt`
        : null;
      tmpl = promptFile
        ? readFileSync(resolve(__dirname, "..", "protocol", promptFile), "utf-8")
        : systemPrompt;
    } else {
      // Default: analytical
      tmpl = readFileSync(resolve(__dirname, "..", "protocol", "prompts", "analytical.txt"), "utf-8");
    }
    const prompt = tmpl.replace("{{BREADTH}}", String(breadth)).replace("{{TOPIC}}", topic);

    const start = Date.now();
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const end = Date.now();

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    const data = extractJson<{ subtopics: string[] }>(text);

    return {
      subtopics: data.subtopics.slice(0, breadth),
      metadata: {
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        model: this.model,
        latency_ms: end - start,
      },
    };
  }

  getModelName(): string {
    return this.model;
  }
}
