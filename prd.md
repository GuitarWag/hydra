# **Project Hydra: Technical PRD**
**Version:** 1.2 (2026 Edition) | **Core Stack:** TS (Primary), Go, Python  
**Primary LLM:** Anthropic Sonnet 4.6

---

## **1. The "Hydra" Protocol (Unified I/O Contract)**
To maintain parity, every implementation must adhere to this JSON structure for tree nodes. This ensures that a tree generated in Go can be processed by a Python client.

### **1.1. The Node Schema**
```json
{
  "id": "uuid-v4",
  "topic": "string",
  "depth": "int",
  "children": "HydraNode[]",
  "resolution": "string | null",
  "metadata": {
    "tokens": "int",
    "model": "string",
    "latency_ms": "int"
  }
}
```

---

## **2. Functional Requirements (FR)**

### **FR-1: Recursive Decomposition Engine**
* **Input:** `initial_prompt: string`, `n: depth_limit`, `breadth: branching_factor`.
* **Logic:** If `current_depth < n`, the engine calls the **Decomposer** to split the topic into `breadth` sub-items.
* **Recursion:** Each sub-item spawns a new child node until `depth == n`.

### **FR-2: Parallel Execution**
* **TS:** Must use `Promise.all` for branch expansion.
* **Go:** Must use `goroutines` and `sync.WaitGroup`.
* **Python:** Must use `asyncio.gather`.

### **FR-3: Multi-Provider Adapter Pattern**
* The SDK must define a `BaseAdapter` interface.
* **Initial Target:** `AnthropicAdapter` supporting **Sonnet 4.6**.
* **Future-Proofing:** Must provide hooks for `OpenAI`, `VertexAI`, and `Bedrock`.

---

## **3. TDD Strategy (The "Porting" Guardrail)**

To ensure 1:1 parity during the porting process, we use a **Mock-First TDD approach**.

### **3.1. Test Suite Requirements**
Every language port must pass these four atomic tests:
1.  **The Identity Test:** If $n=0$, the tree contains only the root.
2.  **The Branching Test:** If $n=1$ and `breadth=3`, the tree must contain exactly 4 nodes.
3.  **The Concurrency Test:** Verify that the engine can handle at least 10 concurrent LLM simulations without state leakage.
4.  **The Context Propagation Test:** Verify that child nodes at depth $n$ have access to the original root topic.

---

## **4. Technical Specifications**

### **4.1. Core Interface (The "Blueprint")**
This interface must be mirrored in Go (Interfaces) and Python (Abstract Base Classes).

| Component | Responsibility |
| :--- | :--- |
| **HydraEngine** | Manages the recursion, depth tracking, and concurrency. |
| **Adapter** | Formats the prompt for the specific LLM and parses the response. |
| **Decomposer** | A specialized prompt that forces the LLM to return exactly $k$ subtopics in JSON. |

### **4.2. Error Handling Protocol**
* **Partial Failure:** If one "head" (branch) fails due to a rate limit or API error, the SDK must not crash. It must return the partial tree and mark the failed node with `status: "failed"`.

---

## **5. Roadmap to Implementation**

### **Step 1: TypeScript (The Source)**
* Implement `HydraCore` in TS.
* Write the `MockAdapter` for deterministic testing.
* Write the `AnthropicAdapter` (Sonnet 4.6).

### **Step 2: The Go Port (via Claude)**
* Supply Claude with the TS source + TDD suite.
* **Target:** High-performance concurrent processing.

### **Step 3: The Python Port (via Claude)**
* Supply Claude with the TS source + TDD suite.
* **Target:** Integration with data science workflows (Pydantic models).

---

### **Prompting Hint for Claude (Porting Time)**
When you give this to Claude for porting, use this framing:
> *"I am building Hydra. Here is the TS PRD and code. Act as a Senior Go Engineer. Port this logic exactly. Use the 'Hydra Protocol' JSON schema. Do not optimize for idiomatic Go if it breaks the recursion logic—prioritize parity with the TS test suite results."*
