import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { GeminiAdapter } from "./gemini_adapter";

function mockFetchResponse(body: object, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

function geminiResponse(text: string, promptTokens = 100, candidateTokens = 50) {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: { promptTokenCount: promptTokens, candidatesTokenCount: candidateTokens },
  };
}

describe("GeminiAdapter", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends request to correct Gemini endpoint", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse(geminiResponse('{"subtopics": ["a", "b"]}')),
    );

    const adapter = new GeminiAdapter("test-key");
    await adapter.decompose("test topic", 2);

    const [url, options] = (globalThis.fetch as Mock).mock.calls[0];
    expect(url).toContain("gemini-2.5-flash:generateContent");
    expect(url).toContain("key=test-key");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("builds correct request body with user contents", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse(geminiResponse('{"subtopics": ["a"]}')),
    );

    await new GeminiAdapter("key").decompose("quantum computing", 1);

    const body = JSON.parse((globalThis.fetch as Mock).mock.calls[0][1].body);
    expect(body.contents[0].role).toBe("user");
    expect(body.contents[0].parts[0].text).toContain("quantum computing");
    expect(body.contents[0].parts[0].text).toContain("1");
    expect(body.generationConfig.maxOutputTokens).toBe(1024);
  });

  it("attaches system_instruction when systemPrompt provided", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse(geminiResponse('{"subtopics": ["a"]}')),
    );

    await new GeminiAdapter("key").decompose("topic", 1, "be concise");

    const body = JSON.parse((globalThis.fetch as Mock).mock.calls[0][1].body);
    expect(body.system_instruction.parts[0].text).toBe("be concise");
  });

  it("omits system_instruction when no systemPrompt", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse(geminiResponse('{"subtopics": ["a"]}')),
    );

    await new GeminiAdapter("key").decompose("topic", 1);

    const body = JSON.parse((globalThis.fetch as Mock).mock.calls[0][1].body);
    expect(body.system_instruction).toBeUndefined();
  });

  it("parses response and returns correct metadata", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse(geminiResponse('{"subtopics": ["sub1", "sub2"]}', 80, 40)),
    );

    const result = await new GeminiAdapter("key").decompose("topic", 2);

    expect(result.subtopics).toEqual(["sub1", "sub2"]);
    expect(result.metadata.tokens).toBe(120);
    expect(result.metadata.model).toBe("gemini-2.5-flash");
    expect(result.metadata.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it("truncates subtopics to breadth limit", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse(geminiResponse('{"subtopics": ["a", "b", "c", "d", "e"]}')),
    );

    const result = await new GeminiAdapter("key").decompose("topic", 3);
    expect(result.subtopics).toHaveLength(3);
    expect(result.subtopics).toEqual(["a", "b", "c"]);
  });

  it("throws on non-OK HTTP response", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse({ error: { message: "Invalid API key" } }, 400),
    );

    await expect(new GeminiAdapter("bad-key").decompose("topic", 2)).rejects.toThrow(
      "Gemini API error 400",
    );
  });

  it("throws on empty content", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse({ candidates: [{ content: { parts: [{ text: "" }] } }] }),
    );

    await expect(new GeminiAdapter("key").decompose("topic", 2)).rejects.toThrow("empty content");
  });

  it("handles markdown-fenced JSON via extractJson", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse(geminiResponse('```json\n{"subtopics": ["parsed"]}\n```')),
    );

    const result = await new GeminiAdapter("key").decompose("topic", 1);
    expect(result.subtopics).toEqual(["parsed"]);
  });

  it("handles missing usageMetadata gracefully", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse({
        candidates: [{ content: { parts: [{ text: '{"subtopics": ["a"]}' }] } }],
      }),
    );

    const result = await new GeminiAdapter("key").decompose("topic", 1);
    expect(result.metadata.tokens).toBe(0);
  });

  it("getModelName returns gemini-2.5-flash", () => {
    expect(new GeminiAdapter("key").getModelName()).toBe("gemini-2.5-flash");
  });
});
