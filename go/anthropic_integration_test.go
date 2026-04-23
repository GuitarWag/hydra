package hydra

import (
	"os"
	"strings"
	"testing"
)

func TestAnthropicIntegration(t *testing.T) {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		t.Skip("ANTHROPIC_API_KEY not set, skipping integration test")
	}

	adapter := NewAnthropicAdapter(apiKey, "claude-haiku-4-5-20251001")

	t.Run("Pre-flight check and decomposition", func(t *testing.T) {
		engine := NewHydraEngine(HydraConfig{
			DepthLimit:      1,
			BranchingFactor: 2,
			Adapter:         adapter,
		})

		root, err := engine.Run("The future of sustainable energy")
		if err != nil {
			t.Fatalf("Engine run failed: %v", err)
		}

		if root.Status != "success" {
			t.Errorf("Expected status success, got %s", root.Status)
		}

		if len(root.Children) != 2 {
			t.Errorf("Expected 2 children, got %d", len(root.Children))
		}

		if !strings.Contains(root.Metadata.Model, "claude-haiku-4-5") {
			t.Errorf("Expected model to contain claude-haiku-4-5, got %s", root.Metadata.Model)
		}

		if root.Metadata.Tokens <= 0 {
			t.Errorf("Expected tokens > 0, got %d", root.Metadata.Tokens)
		}
	})
}
