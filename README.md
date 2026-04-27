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
| **LLM Clients** | `@anthropic-ai/sdk`, `@google/genai` | Raw HTTP | `anthropic` async SDK |
| **Tests** | Vitest | `go test` | pytest |

## Quick Start

### Prerequisites

- Node.js 24+, Go 1.26+, Python 3.13+
- An [Anthropic API key](https://console.anthropic.com/) and/or a [Google AI Studio key](https://aistudio.google.com/apikey)
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
import { GeminiAdapter } from "./src/gemini_adapter";   // Google AI Studio

// Anthropic
const engine = new HydraEngine({
  depthLimit: 1,
  branchingFactor: 4,
  adapter: new AnthropicAdapter(process.env.ANTHROPIC_API_KEY!),
});

// Google Gemini (set GOOGLE_API_KEY in .env)
const geminiEngine = new HydraEngine({
  depthLimit: 1,
  branchingFactor: 4,
  adapter: new GeminiAdapter(process.env.GOOGLE_API_KEY!),
});

const result = await engine.run(
  "How does climate change disrupt global food supply chains, and what role can vertical farming and gene-edited crops play in adaptation?"
);

// Access root node
console.log(result.root.topic);

// Traverse all nodes without writing recursion
result.traverse(({ node, parent, path }) => {
  console.log(`${"  ".repeat(node.depth)}${node.topic}`);
});
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
        DepthLimit:      1,
        BranchingFactor: 4,
        Adapter:         adapter,
    })

    tree, _ := engine.Run(
        "What are the ethical considerations of using AI in criminal sentencing, and how do common law versus civil law traditions differ in approaching algorithmic accountability?",
    )
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
        depth_limit=2,
        branching_factor=3,
        adapter=adapter,
    ))
    tree = await engine.run(
        "Compare the privacy implications of centralized versus decentralized digital identity systems, considering technical trade-offs and regulatory frameworks like GDPR."
    )
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

## Traversing Results

`engine.run()` in TypeScript returns a `HydraResult` — the tree root plus a built-in iterative traversal method. Use `.traverse()` instead of writing your own recursion.

```typescript
const result = await engine.run("Your question here");

// BFS — visits every node level by level (default)
result.traverse(({ node, parent, path }) => {
  // node   — current HydraNode
  // parent — direct parent HydraNode (null for root)
  // path   — ancestry chain from root → current node
  console.log(path.map(n => n.topic).join(" > "));
});

// Collect all nodes
const all = [];
result.traverse(({ node }) => all.push(node));

// Collect only leaves
const leaves = [];
result.traverse(({ node }) => {
  if (node.children.length === 0) leaves.push(node.topic);
});

// Find by depth
const depthTwo = [];
result.traverse(({ node }) => {
  if (node.depth === 2) depthTwo.push(node);
});

// Inspect the parent relationship
result.traverse(({ node, parent }) => {
  if (parent) console.log(`${parent.topic} → ${node.topic}`);
});
```

The raw root is always at `result.root` if you need direct access.

---

## Real-World Use Cases

### Parallel Research Pipelines

Decompose complex questions, then research each dimension concurrently:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { HydraEngine } from "./src/engine";
import { AnthropicAdapter } from "./src/anthropic_adapter";

// Step 1: Decompose
const engine = new HydraEngine({
  depthLimit: 1,
  branchingFactor: 4,
  adapter: new AnthropicAdapter(process.env.ANTHROPIC_API_KEY!),
});

const result = await engine.run(
  "What are the technical, regulatory, and societal barriers to widespread brain-computer interface adoption?"
);

// Step 2: Collect subtopics via traverse, research each in parallel
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const subtopics: string[] = [];
result.traverse(({ node }) => {
  if (node.depth === 1) subtopics.push(node.topic);
});

const researches = await Promise.all(
  subtopics.map((topic) =>
    client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Research this dimension thoroughly with citations: ${topic}`,
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
      `## ${subtopics[i]}\n${r.content[0].text}`
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
  depthLimit: 3,
  branchingFactor: 4,
  adapter: new CachedAnthropicAdapter(process.env.ANTHROPIC_API_KEY!),
});

const tree = await engine.run("Your complex question...");
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
        DepthLimit:      2,
        BranchingFactor: 3,
        Adapter:         quickAdapter,
    })
    tree, _ := engine.Run("What are the second-order effects of remote work?")
    
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
| `depthLimit` | Recursion depth (0 = root only, no LLM calls) | `1` or `2` |
| `branchingFactor` | Subtopics generated per node | `3` to `5` |
| `adapter` | LLM adapter instance | `AnthropicAdapter` |
| `persona` | Decomposition mode: `"analytical"` or `"action"` | `"action"` |
| `systemPrompt` | Custom prompt override (replaces persona) | `"Custom instructions..."` |

The prompt is passed to `run()` at execution time, allowing you to reuse the same engine for multiple questions.

### Personas

- **analytical** (default): Research questions, policy analysis, compound comparisons
- **action**: Customer support, task breakdown, simple requests

Example:
```typescript
// Action mode for customer support
const engine = new HydraEngine({
  depthLimit: 1,
  branchingFactor: 2,
  adapter: myAdapter,
  persona: "action"
});
```

**Cost model:** A tree with `depth=D` and `branching=B` makes at most `(B^D - 1) / (B - 1)` LLM calls. Examples:

| Depth | Branching | LLM Calls | Typical Latency |
|-------|-----------|-----------|-----------------|
| 1 | 4 | 1 | ~3-6s |
| 2 | 3 | 4 | ~8-12s |
| 2 | 4 | 5 | ~10-15s |
| 3 | 3 | 13 | ~15-25s |

## Built-in Adapters

| Adapter | Languages | Key |
|---------|-----------|-----|
| `AnthropicAdapter` | TS, Go, Python | `ANTHROPIC_API_KEY` |
| `OpenAIAdapter` | TS, Go | `OPENAI_API_KEY` (any OpenAI-compatible endpoint) |
| `GeminiAdapter` | TS, Go | `GOOGLE_API_KEY` (Google AI Studio) |

```typescript
// Anthropic
new AnthropicAdapter(process.env.ANTHROPIC_API_KEY!)

// OpenAI-compatible (OpenAI, Ollama, Groq, Together…)
new OpenAIAdapter({ apiKey: "...", model: "gpt-4o", baseUrl: "https://..." })

// Gemini 2.5 Flash via Google AI Studio
new GeminiAdapter(process.env.GOOGLE_API_KEY!)
```

```go
hydra.NewAnthropicAdapter(os.Getenv("ANTHROPIC_API_KEY"), "claude-haiku-4-5-20251001")
hydra.NewOpenAIAdapter(os.Getenv("OPENAI_API_KEY"), "gpt-4o", "")
hydra.NewGeminiAdapter(os.Getenv("GOOGLE_API_KEY"), "gemini-2.5-flash")
```

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
    breadth: number,
    systemPrompt?: string
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
    systemPrompt string,
  ) (*DecomposerResponse, error)
  GetModelName() string
}
```

</td>
<td>

```python
class Adapter(ABC):
  async def decompose(
    self, topic: str, breadth: int,
    system_prompt: str = None
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

LLM-as-judge evaluations for decomposition quality. Each case decomposes a compound question, then a separate judge LLM scores the result on four dimensions (1-5). Pass threshold: all scores >= 3 and average >= 3.5.

### Gemini 2.5 Flash (decomposer) + Gemini 2.5 Pro (judge)

| Eval Case | Coverage | Distinctness | Relevance | Granularity | Result |
|-----------|----------|--------------|-----------|-------------|--------|
| EV vs hydrogen | 5 | 5 | 4 | 4 | **PASS** |
| Remote work effects | 5 | 4 | 5 | 4 | **PASS** |
| Customer support | 5 | 5 | 5 | 5 | **PASS** |
| AI regulation tradeoffs | 5 | 5 | 5 | 5 | **PASS** |
| Social media moderation | 5 | 5 | 5 | 5 | **PASS** |
| Travel booking | 5 | 5 | 5 | 5 | **PASS** |

**6/6 passing** | Average scores: coverage 5.0, distinctness 4.8, relevance 4.8, granularity 4.7

```bash
# Uses HYDRA_EVAL_MODEL and HYDRA_JUDGE_MODEL from .env
mise run eval

# Or directly
cd go && go test -v -run TestEvalDecomposition -timeout 300s ./...
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

Set in `.env` — evals load it automatically:

```bash
# Anthropic
HYDRA_EVAL_MODEL=claude-haiku-4-5-20251001
HYDRA_JUDGE_MODEL=claude-sonnet-4-6

# Gemini
HYDRA_EVAL_MODEL=gemini-2.5-flash
HYDRA_JUDGE_MODEL=gemini-2.5-flash

# Mix providers
HYDRA_EVAL_MODEL=gemini-2.5-flash        # decomposer
HYDRA_JUDGE_MODEL=claude-sonnet-4-6      # judge (needs ANTHROPIC_API_KEY)
```

The eval harness auto-routes to the right adapter based on model name prefix (`claude-*` → Anthropic, `gemini-*` → Google AI Studio).

## License

ISC
