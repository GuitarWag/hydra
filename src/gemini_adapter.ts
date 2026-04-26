import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extractJson } from "./json_repair";
import type { Adapter, DecomposerResponse } from "./types";

const MODEL = "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
  };
}

export class GeminiAdapter implements Adapter {
  constructor(private apiKey: string) {}

  async decompose(
    topic: string,
    breadth: number,
    systemPrompt?: string,
  ): Promise<DecomposerResponse> {
    const tmpl = readFileSync(resolve(__dirname, "..", "protocol", "decompose.prompt"), "utf-8");
    const prompt = tmpl.replace("{{BREADTH}}", String(breadth)).replace("{{TOPIC}}", topic);

    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024 },
    };

    if (systemPrompt) {
      body.system_instruction = { parts: [{ text: systemPrompt }] };
    }

    const start = Date.now();
    const response = await fetch(`${BASE_URL}/${MODEL}:generateContent?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const latency = Date.now() - start;

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${text.slice(0, 300)}`);
    }

    const result: GeminiResponse = await response.json();
    const text = result.candidates[0]?.content?.parts[0]?.text ?? "";
    if (!text) {
      throw new Error("Gemini API returned empty content");
    }

    const data = extractJson<{ subtopics: string[] }>(text);
    const tokens =
      (result.usageMetadata?.promptTokenCount ?? 0) +
      (result.usageMetadata?.candidatesTokenCount ?? 0);

    return {
      subtopics: data.subtopics.slice(0, breadth),
      metadata: { tokens, model: MODEL, latency_ms: latency },
    };
  }

  getModelName(): string {
    return MODEL;
  }
}
