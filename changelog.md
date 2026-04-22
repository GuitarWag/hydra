# Changelog

All notable changes to Project Hydra will be documented in this file.

## [1.0.0] - 2026-04-22

### Added
- **TypeScript Source:** Initial implementation of `HydraEngine`, `MockAdapter`, and `AnthropicAdapter` (Sonnet 3.5/4.6).
- **Go Port:** High-performance concurrent implementation using goroutines and `sync.WaitGroup`.
- **Python Port:** Async implementation using `asyncio` and `Pydantic` for strict data validation.
- **Unified Protocol:** All implementations adhere to the Hydra Node JSON schema.
- **TDD Suite:** Identity, Branching, Concurrency, Context Propagation, and Partial Failure tests passed across all languages.
- **Integration Tests:** Verified real-world connectivity with Anthropic API (Claude Haiku 4.5).
- **Task Management:** Initialized `tasks.md` tracking the full implementation lifecycle.
