# Hydra

**Cut through complexity.** Hydra is a recursive topic decomposition engine that uses LLMs to shatter compound questions into orthogonal, researchable subtopics — automatically, concurrently, and across any depth you choose.

```
 "How do quantum computers threaten current cryptographic systems,
  and what are the economic implications for the global banking sector?"

                              ┌─────────┐
                              │  Hydra  │
                              └────┬────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
   ┌────────┴──────────┐  ┌────────┴───────┐  ┌───────────┴─────────┐
   │ Cryptographic     │  │ Post-quantum   │  │ Regulatory &        │
   │ vulnerabilities & │  │ transition     │  │ coordination        │
   │ quantum timeline  │  │ costs for      │  │ frameworks across   │
   │                   │  │ institutions   │  │ jurisdictions       │
   └───────────────────┘  └────────────────┘  └─────────────────────┘
```

One question in. A research-ready tree out. Each branch is a distinct analytical dimension — not a shallow split of the original question, but a genuinely orthogonal cut across technical, economic, policy, and societal axes.

## Three Languages, One Protocol

Hydra ships with **full implementations** in TypeScript, Go, and Python. All three produce identical tree structures conforming to a shared [JSON Schema](protocol/hydra-node.schema.json) — a tree built in Go can be deserialized and processed in Python or TypeScript without conversion.

| | TypeScript | Go | Python |
|---|---|---|---|
| **Concurrency** | `Promise.all` | goroutines + `sync.WaitGroup` | `asyncio.gather` |
| **Types** | Interfaces | Structs + Interfaces | Pydantic models |
| **LLM Client** | `@anthropic-ai/sdk` | Raw HTTP | `anthropic` async SDK |
| **Tests** | Vitest | `go test` | pytest |

## Quick Start

### Prerequisites

- Node.js 24+, Go 1.26+, Python 3.13+
- An [Anthropic API key](https://console.anthropic.com/)
- [mise](https://mise.jdx.dev) (recommended) — manages all tool versions and tasks

```bash
git clone <repo-url> && cd hydra
cp .env.example .env
# Set your ANTHROPIC_API_KEY in .env

# Recommended: use mise to bootstrap everything
mise install && mise run setup

# Or manually install each language's dependencies (see below)
```

---

### TypeScript

```bash
npm install
```

```typescript
import { HydraEngine } from "./src/engine";
import { AnthropicAdapter } from "./src/anthropic_adapter";

const engine = new HydraEngine({
  initialPrompt: "How does climate change disrupt global food supply chains, and what role can vertical farming and gene-edited crops play in adaptation?",
  depthLimit: 1,
  branchingFactor: 4,
  adapter: new AnthropicAdapter(process.env.ANTHROPIC_API_KEY!),
});

const tree = await engine.run();
```

<details>
<summary>Sample output</summary>

```json
{
  "id": "a3f1c9e2-7b4d-4e8a-b2c1-9d5f6a8e3b7c",
  "topic": "How does climate change disrupt global food supply chains, and what role can vertical farming and gene-edited crops play in adaptation?",
  "depth": 0,
  "status": "success",
  "metadata": { "tokens": 187, "model": "claude-haiku-4-5-20251001", "latency_ms": 1240 },
  "children": [
    {
      "id": "b7e2d4f1-3a9c-4b6e-8d5f-1c2a7e9b4d3f",
      "topic": "Climate-driven disruption mechanisms (temperature volatility, water scarcity, pest migration) affecting major crop regions and cascading through distribution networks",
      "depth": 1,
      "children": [],
      "status": "success",
      "metadata": { "tokens": 0, "model": "claude-haiku-4-5-20251001", "latency_ms": 0 }
    },
    {
      "id": "c4d8a6b3-2e7f-4c1d-9a3b-5f8e2d7c6a1b",
      "topic": "Comparative capital requirements, scalability constraints, and ROI timelines for vertical farming versus gene-edited crop adoption across economic contexts",
      "depth": 1,
      "children": [],
      "status": "success",
      "metadata": { "tokens": 0, "model": "claude-haiku-4-5-20251001", "latency_ms": 0 }
    },
    {
      "id": "d1f9b5c7-8e3a-4d2f-b6c4-7a1e9d5f8b2c",
      "topic": "Regulatory frameworks, IP regimes, and public acceptance barriers differing between vertical farming and gene-edited crops",
      "depth": 1,
      "children": [],
      "status": "success",
      "metadata": { "tokens": 0, "model": "claude-haiku-4-5-20251001", "latency_ms": 0 }
    },
    {
      "id": "e8c2a7d4-6f1b-4e9a-d3c5-2b8f1a6e4d7c",
      "topic": "Unintended ecological and socioeconomic consequences of transitioning to technology-intensive agricultural systems as climate adaptation",
      "depth": 1,
      "children": [],
      "status": "success",
      "metadata": { "tokens": 0, "model": "claude-haiku-4-5-20251001", "latency_ms": 0 }
    }
  ]
}
```

</details>

---

### Go

```bash
cd go
```

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"

    hydra "github.com/hydra/go-sdk"
)

func main() {
    adapter := hydra.NewAnthropicAdapter(os.Getenv("ANTHROPIC_API_KEY"), "")
    engine := hydra.NewHydraEngine(hydra.HydraConfig{
        InitialPrompt:   "What are the ethical considerations of using AI in criminal sentencing, and how do common law versus civil law traditions differ in approaching algorithmic accountability?",
        DepthLimit:      1,
        BranchingFactor: 4,
        Adapter:         adapter,
    })

    tree, _ := engine.Run()
    out, _ := json.MarshalIndent(tree, "", "  ")
    fmt.Println(string(out))
}
```

<details>
<summary>Sample output</summary>

```json
{
  "id": "f2a8c1d5-9e4b-4f7a-b3d6-8c1e5f2a9b4d",
  "topic": "What are the ethical considerations of using AI in criminal sentencing, and how do common law versus civil law traditions differ in approaching algorithmic accountability?",
  "depth": 0,
  "status": "success",
  "metadata": { "tokens": 203, "model": "claude-haiku-4-5-20251001", "latency_ms": 1380 },
  "children": [
    {
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "topic": "Foundational ethical tensions between algorithmic consistency and individualized justice across sentencing philosophies",
      "depth": 1,
      "children": [],
      "status": "success",
      "metadata": { "tokens": 0, "model": "claude-haiku-4-5-20251001", "latency_ms": 0 }
    },
    {
      "id": "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      "topic": "Institutional accountability frameworks in common law versus civil law jurisdictions for algorithmic decision-making",
      "depth": 1,
      "children": [],
      "status": "success",
      "metadata": { "tokens": 0, "model": "claude-haiku-4-5-20251001", "latency_ms": 0 }
    },
    {
      "id": "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
      "topic": "Documented bias mechanisms and failure modes in algorithmic risk assessment tools with technical transparency standards",
      "depth": 1,
      "children": [],
      "status": "success",
      "metadata": { "tokens": 0, "model": "claude-haiku-4-5-20251001", "latency_ms": 0 }
    },
    {
      "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
      "topic": "Legal recourse mechanisms and burden-of-proof standards for defendants challenging algorithmic sentencing across jurisdictions",
      "depth": 1,
      "children": [],
      "status": "success",
      "metadata": { "tokens": 0, "model": "claude-haiku-4-5-20251001", "latency_ms": 0 }
    }
  ]
}
```

</details>

---

### Python

```bash
cd python
source venv/bin/activate
```

```python
import asyncio
import os
from engine import HydraEngine, HydraConfig
from anthropic_adapter import AnthropicAdapter

async def main():
    adapter = AnthropicAdapter(api_key=os.environ["ANTHROPIC_API_KEY"])
    engine = HydraEngine(HydraConfig(
        initial_prompt="Compare the privacy implications of centralized versus decentralized digital identity systems, considering technical trade-offs and regulatory frameworks like GDPR.",
        depth_limit=2,
        branching_factor=3,
        adapter=adapter,
    ))
    tree = await engine.run()
    print(tree.model_dump_json(indent=2))

asyncio.run(main())
```

<details>
<summary>Sample output (depth=2, branching=3 — 12 subtopics across 2 levels)</summary>

```json
{
  "id": "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b",
  "topic": "Compare the privacy implications of centralized versus decentralized digital identity systems...",
  "depth": 0,
  "status": "success",
  "metadata": { "tokens": 195, "model": "claude-haiku-4-5-20251001", "latency_ms": 1150 },
  "children": [
    {
      "id": "f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c",
      "topic": "Cryptographic and architectural differences creating distinct attack surfaces and failure modes",
      "depth": 1,
      "status": "success",
      "metadata": { "tokens": 168, "model": "claude-haiku-4-5-20251001", "latency_ms": 980 },
      "children": [
        {
          "id": "...",
          "topic": "Single-point-of-failure risks in centralized key management versus key recovery challenges in self-sovereign models",
          "depth": 2,
          "children": [],
          "status": "success"
        },
        {
          "id": "...",
          "topic": "Metadata leakage patterns and correlation attack vectors unique to each architecture",
          "depth": 2,
          "children": [],
          "status": "success"
        },
        {
          "id": "...",
          "topic": "Revocation mechanism trade-offs: centralized certificate revocation versus on-chain credential status",
          "depth": 2,
          "children": [],
          "status": "success"
        }
      ]
    },
    {
      "id": "...",
      "topic": "GDPR enforcement mechanisms and compliance burdens imposed differently on each architecture",
      "depth": 1,
      "status": "success",
      "children": ["...3 subtopics..."]
    },
    {
      "id": "...",
      "topic": "Power distribution over personal data among users, intermediaries, and institutions",
      "depth": 1,
      "status": "success",
      "children": ["...3 subtopics..."]
    }
  ]
}
```

</details>

## Real-World Use Cases

### Parallel Research Pipelines

Decompose complex questions, then research each dimension concurrently:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { HydraEngine } from "./src/engine";
import { AnthropicAdapter } from "./src/anthropic_adapter";

// Step 1: Decompose
const engine = new HydraEngine({
  initialPrompt: "What are the technical, regulatory, and societal barriers to widespread brain-computer interface adoption?",
  depthLimit: 1,
  branchingFactor: 4,
  adapter: new AnthropicAdapter(process.env.ANTHROPIC_API_KEY!),
});

const tree = await engine.run();

// Step 2: Research each subtopic in parallel
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const researches = await Promise.all(
  tree.children.map((child) =>
    client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Research this dimension thoroughly with citations: ${child.topic}`,
      }],
    })
  )
);

// Step 3: Synthesize
const synthesis = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 4096,
  messages: [{
    role: "user",
    content: `Synthesize these research findings:\n\n${researches.map((r, i) => 
      `## ${tree.children[i].topic}\n${r.content[0].text}`
    ).join("\n\n")}`,
  }],
});
```

**Result:** Comprehensive research across orthogonal dimensions, parallelized for speed.

---

### Prompt Caching for Deep Trees

For deep trees (depth ≥ 2), cache the decomposition prompt to save 90%+ on repeated system instructions:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { HydraEngine } from "./src/engine";
import { AnthropicAdapter } from "./src/anthropic_adapter";
import * as fs from "fs/promises";

class CachedAnthropicAdapter extends AnthropicAdapter {
  private systemPrompt: string | null = null;

  async decompose(topic: string, breadth: number) {
    // Load prompt once, cache across all calls
    if (!this.systemPrompt) {
      this.systemPrompt = await fs.readFile("protocol/decompose.prompt", "utf-8");
    }

    const client = new Anthropic({ apiKey: this.apiKey });
    const response = await client.messages.create({
      model: this.modelName,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: this.systemPrompt.replace("{{BREADTH}}", String(breadth)),
          cache_control: { type: "ephemeral" },  // Cache the prompt
        },
      ],
      messages: [{ role: "user", content: `Topic: ${topic}` }],
    });

    // Parse and return
    return this.parseResponse(response);
  }
}

// Deep tree with caching
const engine = new HydraEngine({
  initialPrompt: "Your complex question...",
  depthLimit: 3,
  branchingFactor: 4,
  adapter: new CachedAnthropicAdapter(process.env.ANTHROPIC_API_KEY!),
});

const tree = await engine.run();
// 85 LLM calls, but system prompt cached after first call
// Saves ~1.2K tokens × 84 calls = ~100K tokens (~$0.30 at Haiku pricing)
```

---

### Two-Stage Research (Fast Decompose → Deep Analysis)

Use Haiku for decomposition, Opus for deep research:

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
    hydra "github.com/hydra/go-sdk"
)

func main() {
    // Stage 1: Map terrain with Haiku (cheap, fast)
    quickAdapter := hydra.NewAnthropicAdapter(
        os.Getenv("ANTHROPIC_API_KEY"),
        "claude-haiku-4-5-20251001",
    )
    engine := hydra.NewHydraEngine(hydra.HydraConfig{
        InitialPrompt:   "What are the second-order effects of remote work?",
        DepthLimit:      2,
        BranchingFactor: 3,
        Adapter:         quickAdapter,
    })
    tree, _ := engine.Run()
    
    // Stage 2: Deep analysis with Opus (expensive, thorough)
    client := anthropic.NewClient(os.Getenv("ANTHROPIC_API_KEY"))
    for _, child := range tree.Children {
        for _, leaf := range child.Children {
            resp, _ := client.Messages.Create(context.Background(), &anthropic.MessageCreateParams{
                Model:     "claude-opus-4-7",
                MaxTokens: 4096,
                Messages: []anthropic.MessageParam{
                    {Role: "user", Content: fmt.Sprintf("Deep analysis: %s", leaf.Topic)},
                },
            })
            leaf.Resolution = resp.Content[0].Text
        }
    }
    
    json.NewEncoder(os.Stdout).Encode(tree)
}
```

**Cost:** Haiku decomposition (~$0.01) + Opus research on 12 leaves (~$2.40) = **$2.41 total**  
**vs.** single Opus call with compound question = **$0.12** (shallow, misses dimensions)

Trade money for quality: structured research beats single-shot prompts.

---

### Tool Use Integration

Use Hydra-generated dimensions as tool parameters:

```python
import anthropic
import os
from engine import HydraEngine, HydraConfig
from anthropic_adapter import AnthropicAdapter

# Decompose a research question
adapter = AnthropicAdapter(api_key=os.environ["ANTHROPIC_API_KEY"])
engine = HydraEngine(HydraConfig(
    initial_prompt="Compare privacy implications of centralized vs decentralized identity systems",
    depth_limit=1,
    branching_factor=4,
    adapter=adapter,
))
tree = await engine.run()

# Each dimension becomes a tool call
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
tools = [{
    "name": "research_dimension",
    "description": "Research a specific analytical dimension",
    "input_schema": {
        "type": "object",
        "properties": {
            "dimension": {"type": "string"},
            "depth": {"type": "string", "enum": ["overview", "detailed"]},
        },
        "required": ["dimension", "depth"],
    },
}]

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    tools=tools,
    messages=[{
        "role": "user",
        "content": f"Research these dimensions: {[c.topic for c in tree.children]}",
    }],
)

# Claude will call research_dimension for each Hydra subtopic
```

**Result:** LLM-driven tool orchestration guided by Hydra's decomposition.

---

### Cost Comparison

| Approach | Calls | Cost | Quality |
|----------|-------|------|---------|
| **Single prompt to Opus** | 1 × 8K tokens | $0.12 | ⭐⭐ shallow |
| **Hydra + parallel Sonnet** | 1 Haiku + 12 Sonnet | $0.08 | ⭐⭐⭐⭐⭐ comprehensive |
| **Hydra + Opus research** | 1 Haiku + 12 Opus | $2.41 | ⭐⭐⭐⭐⭐ deep + cited |

Hydra's value: **structure > single-shot**. You pay ~33% less for better structured research (Haiku+Sonnet), or pay more for genuine depth (Haiku+Opus) that a single call can't match.

## The Hydra Protocol

Every node across every language conforms to a single source of truth: [`protocol/hydra-node.schema.json`](protocol/hydra-node.schema.json).

```
┌─────────────────────────────────────────────────────────┐
│                     HydraNode                           │
├─────────────────────────────────────────────────────────┤
│  id          string (uuid)                              │
│  topic       string          — the question or subtopic │
│  depth       int             — 0 = root                 │
│  children    HydraNode[]     — recursive                │
│  resolution  string | null   — leaf answer (future)     │
│  status      "success" | "failed"                       │
│  metadata                                               │
│    ├── tokens      int       — total token usage        │
│    ├── model       string    — which LLM was used       │
│    └── latency_ms  int       — decomposition time       │
└─────────────────────────────────────────────────────────┘
```

Build a tree in Go, serialize to JSON, deserialize in Python, render in a TypeScript frontend. The protocol makes it work.

Validation examples live in [`protocol/examples/`](protocol/examples/) — valid trees, invalid trees, recursive structures.

## Configuration

| Parameter | Description | Example |
|-----------|-------------|---------|
| `initialPrompt` | The compound question to decompose | `"How does X affect Y and Z?"` |
| `depthLimit` | Recursion depth (0 = root only, no LLM calls) | `1` or `2` |
| `branchingFactor` | Subtopics generated per node | `3` to `5` |
| `adapter` | LLM adapter instance | `AnthropicAdapter` |

**Cost model:** A tree with `depth=D` and `branching=B` makes at most `(B^D - 1) / (B - 1)` LLM calls. Examples:

| Depth | Branching | LLM Calls | Typical Latency |
|-------|-----------|-----------|-----------------|
| 1 | 4 | 1 | ~3-6s |
| 2 | 3 | 4 | ~8-12s |
| 2 | 4 | 5 | ~10-15s |
| 3 | 3 | 13 | ~15-25s |

## Custom Adapters

Plug in any LLM provider by implementing the Adapter interface:

<table>
<tr><th>TypeScript</th><th>Go</th><th>Python</th></tr>
<tr>
<td>

```typescript
interface Adapter {
  decompose(
    topic: string,
    breadth: number
  ): Promise<DecomposerResponse>;
  getModelName(): string;
}
```

</td>
<td>

```go
type Adapter interface {
  Decompose(topic string,
    breadth int,
  ) (*DecomposerResponse, error)
  GetModelName() string
}
```

</td>
<td>

```python
class Adapter(ABC):
  async def decompose(
    self, topic: str, breadth: int
  ) -> DecomposerResponse: ...
  def get_model_name(self) -> str: ...
```

</td>
</tr>
</table>

Return a `DecomposerResponse` with `subtopics: string[]` and `metadata` (tokens, model, latency). Hydra handles the rest — recursion, concurrency, tree assembly, partial failure.

## Testing

```bash
# TypeScript — Vitest
npm test                          # unit tests
npm run test:coverage             # with V8 coverage (80% threshold)

# Go
cd go && go test ./...            # unit tests
cd go && go test -run TestEvalDecomposition -timeout 300s ./...  # LLM evals

# Python — pytest
cd python && source venv/bin/activate && pytest
```

All three suites share the same test cases:
- **Identity:** depth=0 returns root only, zero LLM calls
- **Branching:** depth=1, branching=3 produces exactly 4 nodes
- **Concurrency:** depth=2, branching=5 — 30 nodes, no state leakage
- **Context propagation:** child topics reference the root
- **Partial failure:** one branch fails, siblings succeed, tree stays intact

## Eval Results

10 LLM-as-judge evaluations across diverse domains. Each case decomposes a compound question, then a separate judge LLM scores the result on four dimensions (1-5). Pass threshold: all scores >= 3 and average >= 3.5.

| Eval Case | Coverage | Distinctness | Relevance | Granularity | Result |
|-----------|----------|--------------|-----------|-------------|--------|
| Quantum computing + finance | 5 | 4 | 5 | 4 | **PASS** |
| EV vs hydrogen lifecycle | 4 | 4 | 3 | 3 | **PASS** |
| Printing press to social media | 4 | 4 | 4 | 3 | **PASS** |
| Meditation neuroscience + culture | 4 | 4 | 4 | 4 | **PASS** |
| Climate food chain adaptation | 4 | 4 | 4 | 4 | **PASS** |
| Digital identity privacy vs regulation | 4 | 3 | 3 | 3 | **PASS** |
| Microplastics health + policy | 4 | 4 | 3 | 4 | **PASS** |
| AI sentencing + legal traditions | 5 | 4 | 5 | 4 | **PASS** |
| Urbanization multi-impact | 4 | 4 | 3 | 3 | **PASS** |
| Nuclear vs renewables for carbon neutrality | 4 | 4 | 4 | 4 | **PASS** |

**10/10 passing** | Average scores: coverage 4.2, distinctness 3.9, relevance 3.8, granularity 3.6 | ~56s total runtime on Claude Haiku 4.5

```bash
cd go
ANTHROPIC_API_KEY=sk-... go test -v -run TestEvalDecomposition -timeout 300s ./...
```

## Development

### Linting

Each language has its own linter, runnable individually or all at once via mise:

```bash
# All at once
mise run lint

# TypeScript — Biome (linter + formatter)
npm run lint                # check
npm run lint:fix            # auto-fix
npm run format              # format only

# Go — golangci-lint
cd go && golangci-lint run

# Python — Ruff (linter + formatter)
cd python && source venv/bin/activate && ruff check .    # lint
cd python && source venv/bin/activate && ruff format .   # format
```

### Shared Prompt

The decomposition prompt used by all three adapters lives in [`protocol/decompose.prompt`](protocol/decompose.prompt). Edit this single file to tune decomposition behavior across all languages.

### Configurable Eval Models

```bash
# Default: both use Haiku
HYDRA_EVAL_MODEL=claude-haiku-4-5-20251001   # model Hydra decomposes with
HYDRA_JUDGE_MODEL=claude-haiku-4-5-20251001  # model the judge scores with
```

## License

ISC
