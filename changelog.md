# Changelog

All notable changes to Project Hydra will be documented in this file.

## [1.2.0] - 2026-04-23

### Added
- **Shared decompose prompt** (`protocol/decompose.prompt`) — single source of truth for all three adapters with `{{BREADTH}}`/`{{TOPIC}}` placeholders.
- **LLM-as-judge evals** (`go/eval_test.go`) — 10 compound question eval cases scored on coverage, distinctness, relevance, and granularity. Configurable via `HYDRA_EVAL_MODEL` and `HYDRA_JUDGE_MODEL` env vars.
- **Biome** for TypeScript linting and formatting (`biome.json`, npm scripts: `lint`, `lint:fix`, `format`).
- **Ruff** for Python linting and formatting (`python/pyproject.toml`).
- **golangci-lint** for Go linting (`go/.golangci.yml`).
- **mise** for unified dev environment (`mise.toml`) — `mise run test`, `mise run lint`, `mise run eval`.
- `CLAUDE.md` and `README.md` project documentation.

### Changed
- Decompose prompt improved with orthogonality instructions across all adapters.
- All adapters now load prompt from shared template file instead of hardcoding.
- TypeScript imports modernized to `node:` protocol.
- Python type annotations modernized (PEP 604 unions, PEP 585 generics).
- Go code formatted with `gofmt` and `golangci-lint` fixes applied.
- `.gitignore` expanded to cover `__pycache__`, `.pytest_cache`, `coverage`, IDE files.

## [1.1.0] - 2026-04-22

### Added
- Vitest coverage tooling (`@vitest/coverage-v8`) with 80% threshold for lines, functions, branches, and statements.
- Test scripts: `test`, `test:watch`, `test:coverage`, `test:ui`.
- `vitest.config.ts` with V8 coverage provider configuration.
- Protocol schema validation examples (`protocol/examples/`).

### Removed
- QA report artifacts (architecture reviews, security audit, coverage dashboard, test strategies).
- Generated coverage output and validation scripts.

### Changed
- All QA and code review tasks marked complete.

## [1.0.0] - 2026-04-22

### Added
- **TypeScript Source:** Initial implementation of `HydraEngine`, `MockAdapter`, and `AnthropicAdapter` (Sonnet 3.5/4.6).
- **Go Port:** High-performance concurrent implementation using goroutines and `sync.WaitGroup`.
- **Python Port:** Async implementation using `asyncio` and `Pydantic` for strict data validation.
- **Unified Protocol:** All implementations adhere to the Hydra Node JSON schema.
- **TDD Suite:** Identity, Branching, Concurrency, Context Propagation, and Partial Failure tests passed across all languages.
- **Integration Tests:** Verified real-world connectivity with Anthropic API (Claude Haiku 4.5).
- **Task Management:** Initialized `tasks.md` tracking the full implementation lifecycle.
