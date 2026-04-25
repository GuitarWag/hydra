import { describe, expect, it } from "vitest";
import { HydraResult } from "./traverse";
import type { HydraNode } from "./types";

function makeNode(topic: string, children: HydraNode[] = []): HydraNode {
  return {
    id: topic,
    topic,
    depth: 0,
    children,
    resolution: null,
    metadata: { tokens: 0, model: "test", latency_ms: 0 },
    status: "success",
  };
}

const leaf1 = makeNode("L1");
const leaf2 = makeNode("L2");
const leaf3 = makeNode("L3");
const leaf4 = makeNode("L4");
const mid1 = makeNode("M1", [leaf1, leaf2]);
const mid2 = makeNode("M2", [leaf3, leaf4]);
const root = makeNode("Root", [mid1, mid2]);

describe("HydraResult.traverse", () => {
  it("visits all 7 nodes", () => {
    const result = new HydraResult(root);
    const topics: string[] = [];
    result.traverse(({ node }) => topics.push(node.topic));
    expect(topics).toHaveLength(7);
  });

  it("BFS order — level by level", () => {
    const result = new HydraResult(root);
    const topics: string[] = [];
    result.traverse(({ node }) => topics.push(node.topic));
    expect(topics).toEqual(["Root", "M1", "M2", "L1", "L2", "L3", "L4"]);
  });

  it("root parent is null", () => {
    const result = new HydraResult(root);
    let rootParent: HydraNode | null = undefined as unknown as HydraNode | null;
    result.traverse(({ node, parent }) => {
      if (node.topic === "Root") rootParent = parent;
    });
    expect(rootParent).toBeNull();
  });

  it("child parent ref points to correct parent node", () => {
    const result = new HydraResult(root);
    const parents: Record<string, string | null> = {};
    result.traverse(({ node, parent }) => {
      parents[node.topic] = parent?.topic ?? null;
    });
    expect(parents.M1).toBe("Root");
    expect(parents.L1).toBe("M1");
    expect(parents.L3).toBe("M2");
  });

  it("path grows correctly depth-first along ancestry", () => {
    const result = new HydraResult(root);
    const paths: Record<string, string[]> = {};
    result.traverse(({ node, path }) => {
      paths[node.topic] = path.map((n) => n.topic);
    });
    expect(paths.Root).toEqual(["Root"]);
    expect(paths.M1).toEqual(["Root", "M1"]);
    expect(paths.L2).toEqual(["Root", "M1", "L2"]);
  });

  it("single node — parent null, path length 1", () => {
    const result = new HydraResult(makeNode("solo"));
    const items: { parent: HydraNode | null; pathLen: number }[] = [];
    result.traverse(({ parent, path }) => items.push({ parent, pathLen: path.length }));
    expect(items).toHaveLength(1);
    expect(items[0].parent).toBeNull();
    expect(items[0].pathLen).toBe(1);
  });
});
