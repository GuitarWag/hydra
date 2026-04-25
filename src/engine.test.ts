import { describe, expect, it } from "vitest";
import { HydraEngine } from "./engine";
import { MockAdapter } from "./mock_adapter";

describe("HydraEngine", () => {
  it("Identity Test: If n=0, the tree contains only the root", async () => {
    const engine = new HydraEngine({
      depthLimit: 0,
      branchingFactor: 3,
      adapter: new MockAdapter(),
    });

    const result = await engine.run("Root");
    expect(result.root.depth).toBe(0);
    expect(result.root.children).toHaveLength(0);
  });

  it("Branching Test: If n=1 and breadth=3, the tree must contain exactly 4 nodes", async () => {
    const engine = new HydraEngine({
      depthLimit: 1,
      branchingFactor: 3,
      adapter: new MockAdapter(),
    });

    const result = await engine.run("Root");
    expect(result.root.children).toHaveLength(3);

    let totalNodes = 1;
    totalNodes += result.root.children.length;

    expect(totalNodes).toBe(4);
  });

  it("Concurrency Test: Handle concurrent expansion (simulated by MockAdapter)", async () => {
    const engine = new HydraEngine({
      depthLimit: 2,
      branchingFactor: 5,
      adapter: new MockAdapter(),
    });

    const result = await engine.run("Root");
    expect(result.root.children).toHaveLength(5);
    expect(result.root.children[0].children).toHaveLength(5);
  });

  it("Context Propagation Test: Verify child nodes have access to original root topic", async () => {
    const rootTopic = "Intelligence";
    const engine = new HydraEngine({
      depthLimit: 2,
      branchingFactor: 2,
      adapter: new MockAdapter(),
    });

    const result = await engine.run(rootTopic);
    expect(result.root.children[0].topic).toContain(rootTopic);
    expect(result.root.children[0].children[0].topic).toContain(rootTopic);
  });

  it("Partial Failure Test: If one branch fails, other branches complete and failed node is marked", async () => {
    class FailingAdapter extends MockAdapter {
      async decompose(topic: string, breadth: number) {
        if (topic.includes("FailMe")) {
          throw new Error("Simulated failure");
        }
        return super.decompose(topic, breadth);
      }
    }

    const adapter = new FailingAdapter();
    const originalDecompose = adapter.decompose.bind(adapter);
    let callCount = 0;
    adapter.decompose = async (topic: string, breadth: number) => {
      callCount++;
      if (callCount === 1) {
        return {
          subtopics: ["SuccessTopic", "FailMeTopic"],
          metadata: { tokens: 10, model: "test", latency_ms: 10 },
        };
      }
      return originalDecompose(topic, breadth);
    };

    const engineWithMock = new HydraEngine({
      depthLimit: 2,
      branchingFactor: 2,
      adapter: adapter,
    });

    const result = await engineWithMock.run("Root");

    expect(result.root.status).toBe("success");
    expect(result.root.children).toHaveLength(2);

    const successBranch = result.root.children.find((c) => c.topic === "SuccessTopic");
    const failBranch = result.root.children.find((c) => c.topic === "FailMeTopic");

    expect(successBranch?.status).toBe("success");
    expect(failBranch?.status).toBe("failed");
    expect(failBranch?.children).toHaveLength(0);
  });
});
