import * as dotenv from "dotenv";
import { describe, expect, it } from "vitest";
import { HydraEngine } from "./engine";
import { GeminiAdapter } from "./gemini_adapter";

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

describe("GeminiAdapter Integration", () => {
  const itIfKey = apiKey ? it : it.skip;

  itIfKey(
    "should successfully decompose a topic using the real Gemini API",
    async () => {
      const adapter = new GeminiAdapter(apiKey as string);
      const engine = new HydraEngine({
        depthLimit: 1,
        branchingFactor: 2,
        adapter,
      });

      const result = await engine.run("The future of sustainable energy");

      expect(result.root.status).toBe("success");
      expect(result.root.children).toHaveLength(2);
      expect(result.root.metadata.model).toBe("gemini-2.5-flash");
      expect(result.root.metadata.tokens).toBeGreaterThan(0);

      console.log("Topic 1:", result.root.children[0].topic);
      console.log("Topic 2:", result.root.children[1].topic);
    },
    30000,
  );
});
