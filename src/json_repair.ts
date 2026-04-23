export class JsonExtractionError extends Error {
  constructor(
    message: string,
    public readonly rawText: string,
  ) {
    super(message);
    this.name = "JsonExtractionError";
  }
}

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : text;
}

function extractBracketedJson(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new JsonExtractionError("No JSON object delimiters found", text.slice(0, 200));
  }
  return text.slice(first, last + 1);
}

function repairCommonIssues(text: string): string {
  let repaired = text.replace(/,\s*([}\]])/g, "$1");

  repaired = repaired.replace(/(?<=[:,[{]\s*)'((?:[^'\\]|\\.)*?)'\s*(?=[,\]}\n])/g, '"$1"');
  repaired = repaired.replace(/(?<=\{|,)\s*'((?:[^'\\]|\\.)*?)'\s*:/g, ' "$1":');

  return repaired;
}

export function extractJson<T>(text: string): T {
  const stripped = stripCodeFences(text);
  const candidate = extractBracketedJson(stripped);

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // fall through to repair attempt
  }

  const repaired = repairCommonIssues(candidate);
  try {
    return JSON.parse(repaired) as T;
  } catch (e) {
    throw new JsonExtractionError(
      `Failed to parse JSON after repair: ${e instanceof Error ? e.message : e}`,
      candidate.slice(0, 200),
    );
  }
}
