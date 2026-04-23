import { describe, expect, it } from "vitest";
import { extractJson, JsonExtractionError } from "./json_repair";

describe("extractJson", () => {
  it("parses clean JSON directly", () => {
    const result = extractJson<{ subtopics: string[] }>('{"subtopics": ["a", "b"]}');
    expect(result).toEqual({ subtopics: ["a", "b"] });
  });

  it("strips markdown code fences with json tag", () => {
    const input = '```json\n{"subtopics": ["a", "b"]}\n```';
    const result = extractJson<{ subtopics: string[] }>(input);
    expect(result).toEqual({ subtopics: ["a", "b"] });
  });

  it("strips markdown code fences without language tag", () => {
    const input = '```\n{"subtopics": ["a"]}\n```';
    const result = extractJson<{ subtopics: string[] }>(input);
    expect(result).toEqual({ subtopics: ["a"] });
  });

  it("extracts JSON from preamble text", () => {
    const input = 'Here is the decomposition:\n\n{"subtopics": ["one", "two"]}\n\nHope this helps!';
    const result = extractJson<{ subtopics: string[] }>(input);
    expect(result).toEqual({ subtopics: ["one", "two"] });
  });

  it("handles trailing commas in arrays", () => {
    const input = '{"subtopics": ["a", "b",]}';
    const result = extractJson<{ subtopics: string[] }>(input);
    expect(result).toEqual({ subtopics: ["a", "b"] });
  });

  it("handles trailing commas in objects", () => {
    const input = '{"key": "value", "other": 1,}';
    const result = extractJson<{ key: string; other: number }>(input);
    expect(result).toEqual({ key: "value", other: 1 });
  });

  it("converts single-quoted values to double quotes", () => {
    const input = "{'subtopics': ['a', 'b']}";
    const result = extractJson<{ subtopics: string[] }>(input);
    expect(result).toEqual({ subtopics: ["a", "b"] });
  });

  it("handles code fence with preamble text", () => {
    const input =
      'Sure! Here is the result:\n\n```json\n{"subtopics": ["x", "y"]}\n```\n\nLet me know if you need more.';
    const result = extractJson<{ subtopics: string[] }>(input);
    expect(result).toEqual({ subtopics: ["x", "y"] });
  });

  it("throws JsonExtractionError when no braces found", () => {
    expect(() => extractJson("no json here")).toThrow(JsonExtractionError);
    expect(() => extractJson("no json here")).toThrow("No JSON object delimiters found");
  });

  it("throws JsonExtractionError on irrecoverable malformed JSON", () => {
    const input = "{subtopics: [a b c]}";
    expect(() => extractJson(input)).toThrow(JsonExtractionError);
    expect(() => extractJson(input)).toThrow("Failed to parse JSON after repair");
  });

  it("includes raw text snippet in error", () => {
    try {
      extractJson("no json here at all");
    } catch (e) {
      expect(e).toBeInstanceOf(JsonExtractionError);
      expect((e as JsonExtractionError).rawText).toBeTruthy();
    }
  });

  it("handles nested JSON objects", () => {
    const input = '{"subtopics": ["a"], "meta": {"count": 1}}';
    const result = extractJson<{ subtopics: string[]; meta: { count: number } }>(input);
    expect(result).toEqual({ subtopics: ["a"], meta: { count: 1 } });
  });

  it("handles whitespace-heavy JSON", () => {
    const input = `
      {
        "subtopics"  :  [
          "a"  ,
          "b"
        ]
      }
    `;
    const result = extractJson<{ subtopics: string[] }>(input);
    expect(result).toEqual({ subtopics: ["a", "b"] });
  });

  it("handles combined issues: code fence + trailing comma + preamble", () => {
    const input = 'Result:\n```json\n{"subtopics": ["a", "b",]}\n```';
    const result = extractJson<{ subtopics: string[] }>(input);
    expect(result).toEqual({ subtopics: ["a", "b"] });
  });
});
