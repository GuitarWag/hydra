import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { extractJson } from "./json_repair";
import type { Adapter, DecomposerResponse } from "./types";

const MODEL = "gemini-2.5-flash";

export class GeminiAdapter implements Adapter {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async decompose(
    topic: string,
    breadth: number,
    systemPrompt?: string,
  ): Promise<DecomposerResponse> {
    const tmpl = readFileSync(resolve(__dirname, "..", "protocol", "decompose.prompt"), "utf-8");
    const prompt = tmpl.replace("{{BREADTH}}", String(breadth)).replace("{{TOPIC}}", topic);

    const config: Record<string, unknown> = { maxOutputTokens: 1024 };
    if (systemPrompt) {
      config.systemInstruction = systemPrompt;
    }

    const start = Date.now();
    const response = await this.client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config,
    });
    const latency = Date.now() - start;

    const text = response.text ?? "";
    if (!text) {
      throw new Error("Gemini API returned empty content");
    }

    const data = extractJson<{ subtopics: string[] }>(text);
    const tokens =
      (response.usageMetadata?.promptTokenCount ?? 0) +
      (response.usageMetadata?.candidatesTokenCount ?? 0);

    return {
      subtopics: data.subtopics.slice(0, breadth),
      metadata: { tokens, model: MODEL, latency_ms: latency },
    };
  }

  getModelName(): string {
    return MODEL;
  }
}
