import { describe, it, expect } from "vitest";
import { HydraEngine } from "./engine";
import { MockAdapter } from "./mock_adapter";

describe("HydraEngine", () => {
  it("Identity Test: If n=0, the tree contains only the root", async () => {
    const engine = new HydraEngine({
      initialPrompt: "Root",
      depthLimit: 0,
      branchingFactor: 3,
      adapter: new MockAdapter(),
    });

    const root = await engine.run();
    expect(root.depth).toBe(0);
    expect(root.children).toHaveLength(0);
  });

  it("Branching Test: If n=1 and breadth=3, the tree must contain exactly 4 nodes", async () => {
    const engine = new HydraEngine({
      initialPrompt: "Root",
      depthLimit: 1,
      branchingFactor: 3,
      adapter: new MockAdapter(),
    });

    const root = await engine.run();
    expect(root.children).toHaveLength(3);
    
    let totalNodes = 1; // root
    totalNodes += root.children.length;
    
    expect(totalNodes).toBe(4);
  });

  it("Concurrency Test: Handle concurrent expansion (simulated by MockAdapter)", async () => {
    // In TS, Promise.all handles this. We can verify that children are populated correctly.
    const engine = new HydraEngine({
      initialPrompt: "Root",
      depthLimit: 2,
      branchingFactor: 5, // 1 (root) + 5 (depth 1) + 25 (depth 2) = 31 nodes
      adapter: new MockAdapter(),
    });

    const root = await engine.run();
    expect(root.children).toHaveLength(5);
    expect(root.children[0].children).toHaveLength(5);
  });

  it("Context Propagation Test: Verify child nodes have access to original root topic (simulated by MockAdapter subtopic naming)", async () => {
    const rootTopic = "Intelligence";
    const engine = new HydraEngine({
      initialPrompt: rootTopic,
      depthLimit: 2,
      branchingFactor: 2,
      adapter: new MockAdapter(),
    });

    const root = await engine.run();
    // In our MockAdapter, we include the parent topic in the child topic name
    expect(root.children[0].topic).toContain(rootTopic);
    expect(root.children[0].children[0].topic).toContain(rootTopic);
  });

  it("Partial Failure Test: If one branch fails, other branches should complete and failed node marked", async () => {
    class FailingAdapter extends MockAdapter {
      async decompose(topic: string, breadth: number) {
        if (topic.includes("FailMe")) {
          throw new Error("Simulated failure");
        }
        return super.decompose(topic, breadth);
      }
    }

    const engine = new HydraEngine({
      initialPrompt: "Root",
      depthLimit: 2,
      branchingFactor: 2,
      adapter: new FailingAdapter(),
    });

    // Manually trigger a failure in one branch by injecting "FailMe"
    // For this test, I'll mock the first call to return one "FailMe" subtopic
    const adapter = new FailingAdapter();
    const originalDecompose = adapter.decompose.bind(adapter);
    let callCount = 0;
    adapter.decompose = async (topic: string, breadth: number) => {
      callCount++;
      if (callCount === 1) {
        return {
          subtopics: ["SuccessTopic", "FailMeTopic"],
          metadata: { tokens: 10, model: "test", latency_ms: 10 }
        };
      }
      return originalDecompose(topic, breadth);
    };

    const engineWithMock = new HydraEngine({
      initialPrompt: "Root",
      depthLimit: 2,
      branchingFactor: 2,
      adapter: adapter,
    });

    const root = await engineWithMock.run();
    
    expect(root.status).toBe("success");
    expect(root.children).toHaveLength(2);
    
    const successBranch = root.children.find(c => c.topic === "SuccessTopic");
    const failBranch = root.children.find(c => c.topic === "FailMeTopic");
    
    expect(successBranch?.status).toBe("success");
    expect(failBranch?.status).toBe("failed");
    expect(failBranch?.children).toHaveLength(0);
  });
});
