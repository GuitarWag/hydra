import type { HydraNode, TraverseItem } from "./types";

export class HydraResult {
  constructor(readonly root: HydraNode) {}

  traverse(fn: (item: TraverseItem) => void): void {
    const queue: TraverseItem[] = [{ node: this.root, parent: null, path: [this.root] }];
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      fn(item);
      for (const child of item.node.children) {
        queue.push({ node: child, parent: item.node, path: [...item.path, child] });
      }
    }
  }
}
