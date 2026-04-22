import * as dotenv from "dotenv";
import { describe, expect, it } from "vitest";
import { AnthropicAdapter } from "./anthropic_adapter";
import { HydraEngine } from "./engine";

dotenv.config();

const apiKey = process.env.ANTHROPIC_API_KEY;

describe("AnthropicAdapter Integration", () => {
  // Only run this test if an API key is provided
  const itIfKey = apiKey ? it : it.skip;

  itIfKey(
    "should successfully decompose a topic using the real Anthropic API",
    async () => {
      const adapter = new AnthropicAdapter(apiKey as string);

      // Pre-flight check: Verify API access with a minimal call
      try {
        await adapter.decompose("test", 1);
      } catch (e) {
        console.error("Pre-flight API check failed:", e instanceof Error ? e.message : e);
        throw e;
      }

      const engine = new HydraEngine({
        initialPrompt: "The future of sustainable energy",
        depthLimit: 1,
        branchingFactor: 2,
        adapter: adapter,
      });

      const root = await engine.run();

      expect(root.status).toBe("success");
      expect(root.children).toHaveLength(2);
      expect(root.metadata.model).toContain("claude-haiku-4-5");
      expect(root.metadata.tokens).toBeGreaterThan(0);

      console.log("Integration Test Result Topic 1:", root.children[0].topic);
      console.log("Integration Test Result Topic 2:", root.children[1].topic);
    },
    30000,
  ); // Increase timeout for real API calls
});
