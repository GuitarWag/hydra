package hydra

import (
	"strings"
	"testing"
)

func TestHydraEngine(t *testing.T) {
	t.Run("Identity Test: If n=0, the tree contains only the root", func(t *testing.T) {
		engine := NewHydraEngine(HydraConfig{
			DepthLimit:      0,
			BranchingFactor: 3,
			Adapter:         &MockAdapter{ModelName: "mock-model"},
		})

		root, _ := engine.Run("Root")
		if root.Depth != 0 {
			t.Errorf("Expected depth 0, got %d", root.Depth)
		}
		if len(root.Children) != 0 {
			t.Errorf("Expected 0 children, got %d", len(root.Children))
		}
	})

	t.Run("Branching Test: If n=1 and breadth=3, the tree must contain exactly 4 nodes", func(t *testing.T) {
		engine := NewHydraEngine(HydraConfig{
			DepthLimit:      1,
			BranchingFactor: 3,
			Adapter:         &MockAdapter{ModelName: "mock-model"},
		})

		root, _ := engine.Run("Root")
		totalNodes := 1 + len(root.Children)
		if totalNodes != 4 {
			t.Errorf("Expected 4 total nodes, got %d", totalNodes)
		}
	})

	t.Run("Concurrency Test: Handle concurrent expansion (simulated)", func(t *testing.T) {
		engine := NewHydraEngine(HydraConfig{
			DepthLimit:      2,
			BranchingFactor: 5,
			Adapter:         &MockAdapter{ModelName: "mock-model"},
		})

		root, _ := engine.Run("Root")
		if len(root.Children) != 5 {
			t.Errorf("Expected 5 children at depth 1, got %d", len(root.Children))
		}
		if len(root.Children[0].Children) != 5 {
			t.Errorf("Expected 5 children at depth 2, got %d", len(root.Children[0].Children))
		}
	})

	t.Run("Context Propagation Test: Verify child nodes have access to original root topic", func(t *testing.T) {
		rootTopic := "Intelligence"
		engine := NewHydraEngine(HydraConfig{
			DepthLimit:      2,
			BranchingFactor: 2,
			Adapter:         &MockAdapter{ModelName: "mock-model"},
		})

		root, _ := engine.Run(rootTopic)
		if !strings.Contains(root.Children[0].Topic, rootTopic) {
			t.Errorf("Child topic should contain root topic, got %s", root.Children[0].Topic)
		}
	})

	t.Run("Partial Failure Test: If one branch fails, failed node marked but others succeed", func(t *testing.T) {
		// Mock adapter that fails for specific topic
		adapter := &MockAdapter{ModelName: "mock-model"}

		engine := NewHydraEngine(HydraConfig{
			DepthLimit:      2,
			BranchingFactor: 2,
			Adapter:         &CustomFailAdapter{adapter},
		})

		root, _ := engine.Run("Root")

		if root.Status != "success" {
			t.Errorf("Root status should be success, got %s", root.Status)
		}

		failFound := false
		successFound := false
		for _, child := range root.Children {
			if child.Status == "failed" {
				failFound = true
			}
			if child.Status == "success" {
				successFound = true
			}
		}

		if !failFound || !successFound {
			t.Errorf("Expected at least one failed and one success child, got fail:%v, success:%v", failFound, successFound)
		}
	})
}

type CustomFailAdapter struct {
	*MockAdapter
}

func (a *CustomFailAdapter) Decompose(topic string, breadth int) (*DecomposerResponse, error) {
	if topic == "Root" {
		return &DecomposerResponse{
			Subtopics: []string{"SuccessTopic", "FailMeTopic"},
			Metadata:  NodeMetadata{Tokens: 10, Model: "test", LatencyMS: 10},
		}, nil
	}
	return a.MockAdapter.Decompose(topic, breadth)
}
