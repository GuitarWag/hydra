import { beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiAdapter } from "./gemini_adapter";

const mockGenerateContent = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

function mockResponse(text: string, promptTokens = 100, candidateTokens = 50) {
  return {
    text,
    usageMetadata: { promptTokenCount: promptTokens, candidatesTokenCount: candidateTokens },
  };
}

describe("GeminiAdapter", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it("calls generateContent with correct model and prompt", async () => {
    mockGenerateContent.mockResolvedValue(mockResponse('{"subtopics": ["a", "b"]}'));

    await new GeminiAdapter("test-key").decompose("quantum computing", 2);

    expect(mockGenerateContent).toHaveBeenCalledOnce();
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.model).toBe("gemini-2.5-flash");
    expect(call.contents).toContain("quantum computing");
    expect(call.contents).toContain("2");
    expect(call.config.maxOutputTokens).toBe(1024);
  });

  it("attaches systemInstruction when systemPrompt provided", async () => {
    mockGenerateContent.mockResolvedValue(mockResponse('{"subtopics": ["a"]}'));

    await new GeminiAdapter("key").decompose("topic", 1, "be concise");

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.systemInstruction).toBe("be concise");
  });

  it("omits systemInstruction when no systemPrompt", async () => {
    mockGenerateContent.mockResolvedValue(mockResponse('{"subtopics": ["a"]}'));

    await new GeminiAdapter("key").decompose("topic", 1);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.systemInstruction).toBeUndefined();
  });

  it("parses response and returns correct metadata", async () => {
    mockGenerateContent.mockResolvedValue(mockResponse('{"subtopics": ["sub1", "sub2"]}', 80, 40));

    const result = await new GeminiAdapter("key").decompose("topic", 2);

    expect(result.subtopics).toEqual(["sub1", "sub2"]);
    expect(result.metadata.tokens).toBe(120);
    expect(result.metadata.model).toBe("gemini-2.5-flash");
    expect(result.metadata.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it("truncates subtopics to breadth limit", async () => {
    mockGenerateContent.mockResolvedValue(mockResponse('{"subtopics": ["a", "b", "c", "d", "e"]}'));

    const result = await new GeminiAdapter("key").decompose("topic", 3);
    expect(result.subtopics).toHaveLength(3);
    expect(result.subtopics).toEqual(["a", "b", "c"]);
  });

  it("throws on empty text response", async () => {
    mockGenerateContent.mockResolvedValue({ text: "", usageMetadata: {} });

    await expect(new GeminiAdapter("key").decompose("topic", 2)).rejects.toThrow("empty content");
  });

  it("handles markdown-fenced JSON via extractJson", async () => {
    mockGenerateContent.mockResolvedValue(mockResponse('```json\n{"subtopics": ["parsed"]}\n```'));

    const result = await new GeminiAdapter("key").decompose("topic", 1);
    expect(result.subtopics).toEqual(["parsed"]);
  });

  it("handles missing usageMetadata gracefully", async () => {
    mockGenerateContent.mockResolvedValue({ text: '{"subtopics": ["a"]}' });

    const result = await new GeminiAdapter("key").decompose("topic", 1);
    expect(result.metadata.tokens).toBe(0);
  });

  it("getModelName returns gemini-2.5-flash", () => {
    expect(new GeminiAdapter("key").getModelName()).toBe("gemini-2.5-flash");
  });
});
