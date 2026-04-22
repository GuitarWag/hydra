# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Hydra

Hydra is a recursive topic decomposition engine that uses LLMs to break compound questions into orthogonal subtopics, building a tree structure. Implemented in three languages (TypeScript, Go, Python) sharing a common protocol schema.

## Setup

```bash
# Recommended: use mise to bootstrap everything
mise install && mise run setup

# Or manually:
npm install
cd go && go mod download
cd python && python -m venv venv && source venv/bin/activate && pip install anthropic pytest pytest-asyncio ruff
```

## Commands

### TypeScript (root directory)
```bash
npm test                    # run all tests (vitest)
npm run test:coverage       # run with V8 coverage (80% threshold)
npx vitest run -t "test name"  # run single test by name
npx vitest run src/engine.test.ts  # run single test file
npm run lint                # biome check
npm run lint:fix            # biome auto-fix
npm run format              # biome format
```

### Go (`go/` directory)
```bash
cd go && go test ./...                          # run all tests
cd go && go test -run TestHydraEngine ./...     # run unit tests only
cd go && go test -run TestEvalDecomposition -timeout 300s ./...  # run LLM evals (needs ANTHROPIC_API_KEY)
cd go && go test -run TestAnthropicIntegration ./...  # integration test (needs ANTHROPIC_API_KEY)
cd go && golangci-lint run                      # lint
```

### Python (`python/` directory, uses venv)
```bash
cd python && source venv/bin/activate && pytest              # run all tests
cd python && source venv/bin/activate && pytest test_engine.py  # run single file
cd python && source venv/bin/activate && pytest -k "test_name"  # run by name
cd python && source venv/bin/activate && ruff check .        # lint
cd python && source venv/bin/activate && ruff format .       # format
```

### Cross-language (via mise)
```bash
mise run test               # run all test suites
mise run lint               # run all linters
```

## Architecture

### Core pattern (same across all three languages)

`Adapter` interface → `HydraEngine` → `HydraNode` tree

1. **Adapter** — abstraction over LLM calls. `decompose(topic, breadth)` returns subtopics. Two implementations: `MockAdapter` (deterministic, for unit tests) and `AnthropicAdapter` (real API via Claude Haiku 4.5).
2. **HydraEngine** — takes config (prompt, depth limit, branching factor, adapter). `run()` recursively calls `expand()` which decomposes each topic and fans out children concurrently.
3. **HydraNode** — tree node with id, topic, depth, children, status, metadata (tokens, model, latency_ms).

Concurrency model differs per language:
- **TypeScript**: `Promise.all` on child expansions
- **Go**: `sync.WaitGroup` + goroutines writing to a buffered channel
- **Python**: `asyncio.gather` on child coroutines

### Shared prompt (`protocol/decompose.prompt`)

The decompose prompt is a single shared template used by all three adapters. Edit this file to change decomposition behavior across all languages. Uses `{{BREADTH}}` and `{{TOPIC}}` placeholders.

### Protocol (`protocol/`)

`hydra-node.schema.json` is the shared JSON Schema (source of truth) defining the HydraNode structure. `protocol/examples/` has validation fixtures.

### Evals (`go/eval_test.go`)

10 LLM-as-judge evaluation cases that test decomposition quality on compound questions. Each case runs Hydra with the real Anthropic adapter, then a separate judge LLM call scores coverage, distinctness, relevance, and granularity (1-5 each, pass threshold: all >= 3 and avg >= 3.5). Requires `ANTHROPIC_API_KEY`.

## Environment

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. Integration tests and evals skip automatically when the key is absent.

## Key design decisions

- Depth limit 0 = root only (identity property). Leaf nodes get no adapter call.
- Partial failure: if a branch's decompose call fails, that node is marked `status: "failed"` but siblings continue.
- The decompose prompt lives in `protocol/decompose.prompt` (shared across all languages). It instructs for orthogonal analytical dimensions, not surface-level question mirroring. Changing this file affects eval scores.
- Eval models are configurable via `HYDRA_EVAL_MODEL` and `HYDRA_JUDGE_MODEL` env vars (default: claude-haiku-4-5).
