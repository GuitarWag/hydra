# Board: My Board
> Description: Task management board
> Created: 2026-04-22T14:10:10.807Z | Updated: 2026-04-23T00:06:09.812Z

## TODO

_No tasks_

## IN PROGRESS

_No tasks_

## DONE

- [x] [T-MOAP0DDH-PSY] **Run evals across multiple models and build comparison matrix** `priority:medium`
  > After prompt improvements land, run the 10 eval cases against at least 3 models (Haiku, Sonnet, one OpenAI model or local Ollama). Build a comparison table showing per-model scores. This validates that the prompt and harness work across providers. Add a mise task: eval:matrix that runs all combinations. Store results in a structured format for tracking over time.
  > Created: 2026-04-22T23:37:35.669Z | Updated: 2026-04-23T00:06:09.812Z
- [x] [T-MOAP03CM-JRK] **Make adapter interface provider-agnostic** `priority:medium`
  > Current AnthropicAdapter hardcodes Anthropic HTTP API. Create a GenericAdapter or LLMAdapter that accepts a provider config (api_url, auth_header, request/response mapping). Alternatively, use LiteLLM (Python), go-openai compatible interface (Go), or similar abstraction. Goal: swap between Anthropic, OpenAI, Ollama, Gemini with config only, no code change. Start with adding an OpenAI-compatible adapter since most providers (including Ollama, Together, Groq) support that format.
  > Created: 2026-04-22T23:37:22.678Z | Updated: 2026-04-23T00:04:10.919Z
- [x] [T-MOAP08P9-B5W] **Add JSON repair/retry layer to adapter** `priority:medium`
  > Different LLMs return JSON with varying reliability — some wrap in markdown code blocks, some add preamble text, some produce malformed JSON. Add a robust extraction layer: 1) strip markdown fences, 2) find first { to last }, 3) attempt parse, 4) if fail, one retry with a corrective prompt. This harness layer should sit in the base adapter logic shared across all languages, not per-provider.
  > Created: 2026-04-22T23:37:29.613Z | Updated: 2026-04-23T00:04:10.889Z
- [x] [T-MOAOZX56-BQ5] **Add grounding constraint to prevent over-abstraction** `priority:high`
  > Sonnet failed evals because it invented abstract frameworks instead of covering what the question explicitly asks. Add a rule to the prompt: 'Before finding cross-cutting angles, ensure every explicit component of the question is addressed by at least one subtopic.' This grounds the decomposition in the actual question before allowing creative orthogonal cuts. This was the #1 failure mode when switching models.
  > Created: 2026-04-22T23:37:14.634Z | Updated: 2026-04-22T23:44:06.962Z
- [x] [T-MOAOZRX4-MJK] **Add structured JSON output schema to prompt** `priority:high`
  > Instead of just asking for JSON, include a strict output schema with field descriptions. Many LLMs (OpenAI, Gemini, Mistral) support structured output or function calling — having a clear schema in the prompt is the lowest common denominator that works everywhere. Specify: subtopics array, each item must be a complete research question (not a keyword), length 15-40 words per subtopic.
  > Created: 2026-04-22T23:37:07.864Z | Updated: 2026-04-22T23:44:06.933Z
- [x] [T-MOAOZMPX-UPQ] **Add few-shot examples to decompose prompt** `priority:high`
  > Current prompt relies on rules alone, which different LLMs interpret differently (Haiku: literal, Sonnet: over-abstract). Add 2-3 concrete few-shot examples showing a compound question and its ideal decomposition. Examples should demonstrate: orthogonal cuts, concrete not abstract subtopics, full coverage of the question's components. This anchors behavior across models better than instructions alone.
  > Created: 2026-04-22T23:37:01.125Z | Updated: 2026-04-22T23:44:06.903Z
- [x] [T-MOAMWGQK-80B] **Update CLAUDE.md and README with new tooling** `priority:low`
  > After all tooling lands, update CLAUDE.md with lint/format commands for each language (biome, ruff, golangci-lint) and mise setup. Update README prerequisites to mention mise. Add Development section covering linting across all three languages.
  > Created: 2026-04-22T22:38:34.172Z | Updated: 2026-04-22T23:08:35.016Z
- [x] [T-MOAMWGOW-42Z] **Add golangci-lint for Go linting** `priority:medium`
  > Create .golangci.yml in go/ with industry-standard linters: govet, errcheck, staticcheck, unused, gosimple, ineffassign, gocritic, gofmt. Fix any existing violations in go/*.go.
  > Created: 2026-04-22T22:38:34.112Z | Updated: 2026-04-22T23:06:00.111Z
- [x] [T-MOAMWGN6-RUQ] **Add Biome for TypeScript linting and formatting** `priority:medium`
  > Install @biomejs/biome as devDep. Create biome.json config at root with sensible defaults matching existing style. Add npm scripts: lint, lint:fix, format. Fix any existing violations in src/*.ts and vitest.config.ts. Biome replaces ESLint + Prettier.
  > Created: 2026-04-22T22:38:34.050Z | Updated: 2026-04-22T23:02:46.786Z
- [x] [T-MOAMWGO1-MHP] **Add Ruff for Python linting and formatting** `priority:medium`
  > Add pyproject.toml at python/ with [tool.ruff] config: line-length 100, target py312+, enable E/F/I/UP/B/SIM rules. Add ruff to venv dev deps. Fix any existing violations in python/*.py. Ruff replaces flake8, isort, and black.
  > Created: 2026-04-22T22:38:34.081Z | Updated: 2026-04-22T22:55:28.530Z
- [x] [T-MOAMWAUA-JZE] **Extract shared decompose prompt to protocol/decompose.prompt** `priority:high`
  > Decompose prompt is duplicated across go/anthropic_adapter.go, src/anthropic_adapter.ts, python/anthropic_adapter.py. Go version has improved orthogonality instructions but TS and Python still have the old basic prompt. Create shared template at protocol/decompose.prompt with placeholders. Update all three adapters to load from this file.
  > Created: 2026-04-22T22:38:26.530Z | Updated: 2026-04-22T22:47:43.633Z
- [x] [T-MOAMWGPR-CVK] **Add mise config for dev environment setup** `priority:medium`
  > Create mise.toml at project root. Pin: node 22.x, go 1.26.x, python 3.12+. Declare mise tasks: test (all three), lint (all three), setup (npm install + go mod download + venv + pip install). Load .env via mise. Single mise install and mise run setup to get running.
  > Created: 2026-04-22T22:38:34.143Z | Updated: 2026-04-22T22:44:39.581Z
- [x] [T-MOA7O0V1-HFE] **Protocol: Implement Shared JSON Schema (Source of Truth)** `priority:medium`
  > Created: 2026-04-22T15:32:06.109Z | Updated: 2026-04-22T20:45:03.480Z
- [x] [T-MOA7O0QR-WUA] **QA: Python Implementation** `priority:medium`
  > Created: 2026-04-22T15:32:05.955Z | Updated: 2026-04-22T20:33:57.356Z
- [x] [T-MOA7O0PX-TNE] **QA: Go Implementation** `priority:medium`
  > Created: 2026-04-22T15:32:05.925Z | Updated: 2026-04-22T20:33:57.326Z
- [x] [T-MOA7O0P3-628] **QA: TypeScript Implementation** `priority:medium`
  > Created: 2026-04-22T15:32:05.895Z | Updated: 2026-04-22T20:33:57.297Z
- [x] [T-MOA7O0RM-M3Z] **Security: Dependency & API Key Audit (All Languages)** `priority:medium`
  > Created: 2026-04-22T15:32:05.986Z | Updated: 2026-04-22T20:33:41.178Z
- [x] [T-MOA7O0U6-37G] **Code Review: Python Asyncio & Pydantic Usage** `priority:medium`
  > Created: 2026-04-22T15:32:06.078Z | Updated: 2026-04-22T18:57:30.106Z
- [x] [T-MOA7O0TB-MOY] **Code Review: Go Concurrency Patterns** `priority:medium`
  > Created: 2026-04-22T15:32:06.047Z | Updated: 2026-04-22T18:53:29.758Z
- [x] [T-MOA7O0SH-O3B] **Code Review: TypeScript Architecture** `priority:medium`
  > Created: 2026-04-22T15:32:06.017Z | Updated: 2026-04-22T18:50:18.036Z
- [x] [T-MOA4QV5T-6XZ] **Step 3: Python Port - Core Engine and Parity Tests** `priority:medium`
  > Created: 2026-04-22T14:10:19.841Z | Updated: 2026-04-22T15:30:18.578Z
- [x] [T-MOA7J5ML-M7S] **Python: AnthropicAdapter (Haiku 4.5)** `priority:medium`
  > Created: 2026-04-22T15:28:19.005Z | Updated: 2026-04-22T15:30:18.546Z
- [x] [T-MOA7J5LP-D9N] **Python: MockAdapter & Parity Tests (pytest)** `priority:medium`
  > Created: 2026-04-22T15:28:18.973Z | Updated: 2026-04-22T15:29:33.729Z
- [x] [T-MOA7J5KM-G56] **Python: HydraEngine Implementation (asyncio)** `priority:medium`
  > Created: 2026-04-22T15:28:18.934Z | Updated: 2026-04-22T15:29:33.699Z
- [x] [T-MOA7J5JS-CU1] **Python: Project Setup & Pydantic Models** `priority:medium`
  > Created: 2026-04-22T15:28:18.904Z | Updated: 2026-04-22T15:29:33.665Z
- [x] [T-MOA4QV4Y-MB4] **Step 2: Go Port - Core Engine and Parity Tests** `priority:medium`
  > Created: 2026-04-22T14:10:19.810Z | Updated: 2026-04-22T15:28:09.868Z
- [x] [T-MOA7BJ3A-MT5] **Go: AnthropicAdapter (Haiku 4.5)** `priority:medium`
  > Created: 2026-04-22T15:22:23.206Z | Updated: 2026-04-22T15:28:09.838Z
- [x] [T-MOA7BJ2F-LZX] **Go: MockAdapter & Parity Tests** `priority:medium`
  > Created: 2026-04-22T15:22:23.175Z | Updated: 2026-04-22T15:24:08.996Z
- [x] [T-MOA7BJ1L-TMI] **Go: HydraEngine Implementation (goroutines)** `priority:medium`
  > Created: 2026-04-22T15:22:23.145Z | Updated: 2026-04-22T15:24:08.966Z
- [x] [T-MOA7BJ0O-GHE] **Go: Project Setup & Types** `priority:medium`
  > Created: 2026-04-22T15:22:23.112Z | Updated: 2026-04-22T15:24:08.932Z
- [x] [T-MOA4QV36-XU7] **Step 1: TypeScript Implementation - AnthropicAdapter (Sonnet 4.6)** `priority:medium`
  > Created: 2026-04-22T14:10:19.746Z | Updated: 2026-04-22T14:57:18.619Z
- [x] [T-MOA4QV41-HPI] **Step 1: TypeScript Implementation - TDD Suite (Identity, Branching, Concurrency, Context)** `priority:medium`
  > Created: 2026-04-22T14:10:19.777Z | Updated: 2026-04-22T14:56:40.577Z
- [x] [T-MOA4QV29-OA4] **Step 1: TypeScript Implementation - HydraCore and MockAdapter** `priority:medium`
  > Created: 2026-04-22T14:10:19.713Z | Updated: 2026-04-22T14:56:40.545Z

## BLOCKED

_No tasks_
