package hydra

import (
	"fmt"
	"strings"
)

type MockAdapter struct {
	ModelName string
}

func (a *MockAdapter) Decompose(topic string, breadth int) (*DecomposerResponse, error) {
	if strings.Contains(topic, "FailMe") {
		return nil, fmt.Errorf("simulated failure")
	}

	subtopics := make([]string, breadth)
	for i := 0; i < breadth; i++ {
		subtopics[i] = fmt.Sprintf("%s - Subtopic %d", topic, i+1)
	}

	return &DecomposerResponse{
		Subtopics: subtopics,
		Metadata: NodeMetadata{
			Tokens:    10,
			Model:     a.ModelName,
			LatencyMS: 10,
		},
	}, nil
}

func (a *MockAdapter) GetModelName() string {
	return a.ModelName
}
