import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { OpenAIAdapter } from "./openai_adapter";

function mockFetchResponse(body: object, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

describe("OpenAIAdapter", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends correct request to default OpenAI base URL", async () => {
    const mockResponse = {
      choices: [{ message: { content: '{"subtopics": ["a", "b", "c"]}' } }],
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    };
    (globalThis.fetch as Mock).mockResolvedValue(mockFetchResponse(mockResponse));

    const adapter = new OpenAIAdapter({
      apiKey: "test-key",
      model: "gpt-4o",
    });

    await adapter.decompose("test topic", 3);

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const [url, options] = (globalThis.fetch as Mock).mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-key");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.model).toBe("gpt-4o");
    expect(body.max_tokens).toBe(1024);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
    expect(body.messages[0].content).toContain("test topic");
  });

  it("parses response and returns DecomposerResponse with correct metadata", async () => {
    const mockResponse = {
      choices: [{ message: { content: '{"subtopics": ["sub1", "sub2"]}' } }],
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    };
    (globalThis.fetch as Mock).mockResolvedValue(mockFetchResponse(mockResponse));

    const adapter = new OpenAIAdapter({
      apiKey: "test-key",
      model: "gpt-4o-mini",
    });

    const result = await adapter.decompose("topic", 2);

    expect(result.subtopics).toEqual(["sub1", "sub2"]);
    expect(result.metadata.tokens).toBe(120);
    expect(result.metadata.model).toBe("gpt-4o-mini");
    expect(result.metadata.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it("truncates subtopics to breadth limit", async () => {
    const mockResponse = {
      choices: [{ message: { content: '{"subtopics": ["a", "b", "c", "d", "e"]}' } }],
      usage: { prompt_tokens: 50, completion_tokens: 50 },
    };
    (globalThis.fetch as Mock).mockResolvedValue(mockFetchResponse(mockResponse));

    const adapter = new OpenAIAdapter({
      apiKey: "test-key",
      model: "gpt-4o",
    });

    const result = await adapter.decompose("topic", 3);
    expect(result.subtopics).toHaveLength(3);
    expect(result.subtopics).toEqual(["a", "b", "c"]);
  });

  it("uses custom baseUrl and strips trailing slash", async () => {
    const mockResponse = {
      choices: [{ message: { content: '{"subtopics": ["a"]}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 10 },
    };
    (globalThis.fetch as Mock).mockResolvedValue(mockFetchResponse(mockResponse));

    const adapter = new OpenAIAdapter({
      apiKey: "ollama-key",
      model: "llama3",
      baseUrl: "http://localhost:11434/v1/",
    });

    await adapter.decompose("topic", 1);

    const [url] = (globalThis.fetch as Mock).mock.calls[0];
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
  });

  it("throws on non-OK HTTP response", async () => {
    (globalThis.fetch as Mock).mockResolvedValue(
      mockFetchResponse({ error: { message: "Invalid API key" } }, 401),
    );

    const adapter = new OpenAIAdapter({
      apiKey: "bad-key",
      model: "gpt-4o",
    });

    await expect(adapter.decompose("topic", 3)).rejects.toThrow("OpenAI API error 401");
  });

  it("throws on empty content response", async () => {
    const mockResponse = {
      choices: [{ message: { content: null } }],
      usage: { prompt_tokens: 10, completion_tokens: 0 },
    };
    (globalThis.fetch as Mock).mockResolvedValue(mockFetchResponse(mockResponse));

    const adapter = new OpenAIAdapter({
      apiKey: "test-key",
      model: "gpt-4o",
    });

    await expect(adapter.decompose("topic", 3)).rejects.toThrow("empty content");
  });

  it("handles response wrapped in markdown code fences via extractJson", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: '```json\n{"subtopics": ["parsed"]}\n```',
          },
        },
      ],
      usage: { prompt_tokens: 20, completion_tokens: 20 },
    };
    (globalThis.fetch as Mock).mockResolvedValue(mockFetchResponse(mockResponse));

    const adapter = new OpenAIAdapter({
      apiKey: "test-key",
      model: "gpt-4o",
    });

    const result = await adapter.decompose("topic", 1);
    expect(result.subtopics).toEqual(["parsed"]);
  });

  it("handles missing usage field gracefully", async () => {
    const mockResponse = {
      choices: [{ message: { content: '{"subtopics": ["a"]}' } }],
    };
    (globalThis.fetch as Mock).mockResolvedValue(mockFetchResponse(mockResponse));

    const adapter = new OpenAIAdapter({
      apiKey: "test-key",
      model: "local-model",
      baseUrl: "http://localhost:11434/v1",
    });

    const result = await adapter.decompose("topic", 1);
    expect(result.metadata.tokens).toBe(0);
  });

  it("getModelName returns the configured model", () => {
    const adapter = new OpenAIAdapter({
      apiKey: "key",
      model: "gpt-4o-mini",
    });
    expect(adapter.getModelName()).toBe("gpt-4o-mini");
  });

  it("populates prompt template with topic and breadth", async () => {
    const mockResponse = {
      choices: [{ message: { content: '{"subtopics": ["x"]}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 10 },
    };
    (globalThis.fetch as Mock).mockResolvedValue(mockFetchResponse(mockResponse));

    const adapter = new OpenAIAdapter({
      apiKey: "test-key",
      model: "gpt-4o",
    });

    await adapter.decompose("quantum computing", 4);

    const body = JSON.parse((globalThis.fetch as Mock).mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("quantum computing");
    expect(body.messages[0].content).toContain("4");
  });
});
