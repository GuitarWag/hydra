package hydra

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

type HydraConfig struct {
	DepthLimit      int
	BranchingFactor int
	Adapter         Adapter
	Persona         string // "analytical" or "action"
	SystemPrompt    string // custom prompt (overrides Persona)
}

type HydraEngine struct {
	config               HydraConfig
	resolvedSystemPrompt string
}

func NewHydraEngine(config HydraConfig) *HydraEngine {
	// Validate: can't have both
	if config.Persona != "" && config.SystemPrompt != "" {
		panic("cannot specify both Persona and SystemPrompt")
	}
	resolved := config.SystemPrompt
	if resolved == "" && config.Persona != "" {
		resolved = config.Persona
	}
	return &HydraEngine{
		config:               config,
		resolvedSystemPrompt: resolved,
	}
}

func (e *HydraEngine) Run(prompt string) (*HydraNode, error) {
	return e.expand(prompt, 0), nil
}

func (e *HydraEngine) expand(topic string, currentDepth int) *HydraNode {
	node := &HydraNode{
		ID:    uuid.New().String(),
		Topic: topic,
		Depth: currentDepth,
		Metadata: NodeMetadata{
			Model: e.config.Adapter.GetModelName(),
		},
		Children: []*HydraNode{},
	}

	if currentDepth >= e.config.DepthLimit {
		node.Status = "success"
		return node
	}

	start := time.Now()
	response, err := e.config.Adapter.Decompose(topic, e.config.BranchingFactor, e.resolvedSystemPrompt)
	latency := int(time.Since(start).Milliseconds())

	if err != nil {
		node.Status = "failed"
		return node
	}

	node.Metadata.Tokens = response.Metadata.Tokens
	node.Metadata.LatencyMS = latency

	var wg sync.WaitGroup
	childChan := make(chan *HydraNode, len(response.Subtopics))

	for _, subtopic := range response.Subtopics {
		wg.Add(1)
		go func(st string) {
			defer wg.Done()
			childChan <- e.expand(st, currentDepth+1)
		}(subtopic)
	}

	// Wait for all branches in parallel
	wg.Wait()
	close(childChan)

	for child := range childChan {
		node.Children = append(node.Children, child)
	}

	node.Status = "success"
	return node
}
