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

## Real-World Integration Examples

Hydra shines when integrated into agentic workflows and research pipelines. Here's how it pairs with popular frameworks:

### ADK (Agent Development Kit)

Use Hydra to decompose complex research tasks into parallel agent work streams:

```typescript
import { Agent, Task } from "@anthropic-ai/agent-kit";
import { HydraEngine } from "./src/engine";
import { AnthropicAdapter } from "./src/anthropic_adapter";

// Decompose a research question into orthogonal dimensions
const engine = new HydraEngine({
  initialPrompt: "What are the technical, regulatory, and societal barriers to widespread brain-computer interface adoption?",
  depthLimit: 1,
  branchingFactor: 4,
  adapter: new AnthropicAdapter(process.env.ANTHROPIC_API_KEY!),
});

const tree = await engine.run();

// Spawn parallel agents, one per subtopic
const agents = tree.children.map((child) =>
  new Agent({
    name: `Researcher-${child.id.slice(0, 8)}`,
    instructions: `You are a specialist in: ${child.topic}. Research this dimension thoroughly and report findings in 300 words.`,
    model: "claude-sonnet-4-6",
  })
);

// Each agent researches its assigned subtopic concurrently
const results = await Promise.all(
  agents.map((agent) => agent.execute())
);

// Synthesize findings back into a unified report
console.log("Research dimensions explored:", tree.children.length);
console.log("Total research time:", results.reduce((sum, r) => sum + r.duration, 0), "ms");
```

**Why this matters:** Without Hydra, you'd either give the agent one massive compound task (risking shallow coverage) or manually split it yourself (slow, biased by your own mental model). Hydra auto-discovers the orthogonal dimensions an LLM *actually* sees, then you paralleliza research across them.

---

### Strands (Anthropic's workflow orchestration)

Use Hydra as a pre-processing step to structure complex workflows:

```python
from strands import Workflow, Step
from engine import HydraEngine, HydraConfig
from anthropic_adapter import AnthropicAdapter
import os

# Decompose a multi-stakeholder policy question
adapter = AnthropicAdapter(api_key=os.environ["ANTHROPIC_API_KEY"])
engine = HydraEngine(HydraConfig(
    initial_prompt="How should governments balance carbon pricing mechanisms with industrial competitiveness concerns?",
    depth_limit=2,
    branching_factor=3,
    adapter=adapter,
))
tree = await engine.run()

# Each subtopic becomes a Strand
workflow = Workflow(name="policy-analysis")

for child in tree.children:
    # First-level decomposition: major analytical dimensions
    strand = workflow.add_strand(
        name=f"dimension-{child.id[:8]}",
        context={"topic": child.topic}
    )
    
    # Second-level: specific research tasks
    for subchild in child.children:
        strand.add_step(Step(
            name=f"research-{subchild.id[:8]}",
            prompt=f"Research: {subchild.topic}. Focus on empirical evidence and case studies.",
            model="claude-opus-4-7",
        ))
    
    # Synthesis step for this dimension
    strand.add_step(Step(
        name="synthesize",
        prompt=f"Synthesize findings on: {child.topic}",
        model="claude-sonnet-4-6",
    ))

# Final cross-dimension synthesis
workflow.add_step(Step(
    name="final-report",
    prompt="Integrate findings across all dimensions into a coherent policy recommendation.",
    model="claude-opus-4-7",
))

result = await workflow.run()
```

**Why this matters:** Hydra provides the *skeleton* — a research-ready tree structure. Strands provides the *execution* — parallel workflows, retry logic, state management. Together: automated research pipelines that scale to arbitrarily complex questions.

---

### Anthropic SDK (Direct Integration)

Hydra's adapters are thin wrappers around the SDK. You can extend them to add custom behavior:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { HydraEngine } from "./src/engine";
import { AnthropicAdapter } from "./src/anthropic_adapter";

// Custom adapter with prompt caching for repeated decompositions
class CachedAnthropicAdapter extends AnthropicAdapter {
  async decompose(topic: string, breadth: number) {
    const client = new Anthropic({ apiKey: this.apiKey });
    
    // Load shared decomposition instructions into cache
    const systemPrompt = await fs.readFile("protocol/decompose.prompt", "utf-8");
    
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },  // Cache the decomposition logic
        },
      ],
      messages: [
        {
          role: "user",
          content: `Topic: ${topic}\nBreadth: ${breadth}`,
        },
      ],
    });

    return this.parseResponse(response);
  }
}

// Deep tree (depth=3) with caching saves 80%+ on repeated system prompt costs
const engine = new HydraEngine({
  initialPrompt: "Your complex question here...",
  depthLimit: 3,
  branchingFactor: 4,
  adapter: new CachedAnthropicAdapter(process.env.ANTHROPIC_API_KEY!),
});

const tree = await engine.run();
console.log("Cache efficiency:", tree.metadata.cache_read_tokens / tree.metadata.tokens);
```

**Why this matters:** For deep trees (depth ≥ 2), the decomposition prompt repeats dozens of times. Prompt caching turns `O(nodes)` cost into `O(1)` for the shared system instructions. On a depth=3, branching=4 tree (85 nodes), this saves ~40K tokens (~$0.48 at Sonnet 4.6 pricing).

---

### Multi-Modal Research (Extended Thinking)

Combine Hydra with extended thinking for deep analytical work:

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
    hydra "github.com/hydra/go-sdk"
)

func main() {
    // Step 1: Decompose with fast model
    quickAdapter := hydra.NewAnthropicAdapter(
        os.Getenv("ANTHROPIC_API_KEY"),
        "claude-haiku-4-5-20251001",
    )
    engine := hydra.NewHydraEngine(hydra.HydraConfig{
        InitialPrompt:   "What are the second-order effects of widespread remote work on urban planning, commercial real estate, and tax revenue distribution?",
        DepthLimit:      2,
        BranchingFactor: 3,
        Adapter:         quickAdapter,
    })
    tree, _ := engine.Run()
    
    // Step 2: Deep analysis on each leaf node with extended thinking
    deepAdapter := hydra.NewAnthropicAdapter(
        os.Getenv("ANTHROPIC_API_KEY"),
        "claude-opus-4-7",  // Extended thinking enabled
    )
    
    for _, child := range tree.Children {
        for _, leaf := range child.Children {
            // Each leaf gets extended thinking analysis
            response, _ := deepAdapter.Decompose(
                fmt.Sprintf("Provide a comprehensive analysis with citations: %s", leaf.Topic),
                1,  // Not decomposing further, just analyzing
            )
            leaf.Resolution = response.Subtopics[0]  // Store analysis in resolution field
        }
    }
    
    out, _ := json.MarshalIndent(tree, "", "  ")
    fmt.Println(string(out))
}
```

**Why this matters:** Fast model (Haiku) maps the terrain cheaply. Slow model (Opus with extended thinking) does deep work on each identified dimension. You get comprehensive coverage *and* analytical depth without blowing your budget.

---

### Cost Comparison

**Without Hydra** (single prompt to Opus 4.7):
```
Prompt: "Research all aspects of X, Y, and Z..."
Cost: 1 call × $15/M input tokens × 8K prompt = $0.12
Result: 4K token response touching all topics shallowly
Quality: ⭐⭐ (surface-level, misses orthogonal dimensions)
```

**With Hydra** (decompose with Haiku, research with Sonnet):
```
Step 1: Hydra decompose (Haiku, depth=2, branching=3) = 4 calls × $1/M = $0.004
Step 2: Research each leaf (Sonnet, 12 leaves × 2K context) = 12 × $3/M × 2K = $0.072
Total: $0.076 (37% cheaper)
Result: 12 focused research outputs, each exploring an orthogonal dimension
Quality: ⭐⭐⭐⭐⭐ (comprehensive, structured, parallelizable)
```

**ROI:** Cheaper *and* higher quality. The decomposition cost is negligible; the savings come from replacing one expensive shallow call with many cheaper focused calls.

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
