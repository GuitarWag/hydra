package hydra

type HydraNode struct {
	ID         string            `json:"id"`
	Topic      string            `json:"topic"`
	Depth      int               `json:"depth"`
	Children   []*HydraNode      `json:"children"`
	Resolution *string           `json:"resolution"`
	Metadata   NodeMetadata      `json:"metadata"`
	Status     string            `json:"status,omitempty"`
}

type NodeMetadata struct {
	Tokens    int    `json:"tokens"`
	Model     string `json:"model"`
	LatencyMS int    `json:"latency_ms"`
}

type DecomposerResponse struct {
	Subtopics []string     `json:"subtopics"`
	Metadata  NodeMetadata `json:"metadata"`
}

type Adapter interface {
	Decompose(topic string, breadth int) (*DecomposerResponse, error)
	GetModelName() string
}
