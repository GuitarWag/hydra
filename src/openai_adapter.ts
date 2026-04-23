import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extractJson } from "./json_repair";
import type { Adapter, DecomposerResponse } from "./types";

interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class OpenAIAdapter implements Adapter {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  }

  async decompose(topic: string, breadth: number): Promise<DecomposerResponse> {
    const tmpl = readFileSync(resolve(__dirname, "..", "protocol", "decompose.prompt"), "utf-8");
    const prompt = tmpl.replace("{{BREADTH}}", String(breadth)).replace("{{TOPIC}}", topic);

    const start = Date.now();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${body.slice(0, 300)}`);
    }

    const result: ChatCompletionResponse = await response.json();

    const text = result.choices[0]?.message?.content ?? "";
    if (!text) {
      throw new Error("OpenAI API returned empty content");
    }

    const data = extractJson<{ subtopics: string[] }>(text);

    const tokens = (result.usage?.prompt_tokens ?? 0) + (result.usage?.completion_tokens ?? 0);

    return {
      subtopics: data.subtopics.slice(0, breadth),
      metadata: {
        tokens,
        model: this.model,
        latency_ms: latency,
      },
    };
  }

  getModelName(): string {
    return this.model;
  }
}
