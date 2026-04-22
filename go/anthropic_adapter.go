package hydra

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type AnthropicAdapter struct {
	APIKey string
	Model  string
}

func NewAnthropicAdapter(apiKey, model string) *AnthropicAdapter {
	if model == "" {
		model = "claude-haiku-4-5-20251001"
	}
	return &AnthropicAdapter{
		APIKey: apiKey,
		Model:  model,
	}
}

type anthropicRequest struct {
	Model     string             `json:"model"`
	MaxTokens int                `json:"max_tokens"`
	Messages  []anthropicMessage `json:"messages"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Usage struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
}

func loadDecomposePrompt() (string, error) {
	_, srcFile, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("unable to determine source file path")
	}
	promptPath := filepath.Join(filepath.Dir(srcFile), "..", "protocol", "decompose.prompt")
	data, err := os.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read decompose prompt: %w", err)
	}
	return string(data), nil
}

func (a *AnthropicAdapter) Decompose(topic string, breadth int) (*DecomposerResponse, error) {
	tmpl, err := loadDecomposePrompt()
	if err != nil {
		return nil, err
	}
	prompt := strings.Replace(tmpl, "{{BREADTH}}", strconv.Itoa(breadth), 1)
	prompt = strings.Replace(prompt, "{{TOPIC}}", topic, 1)

	reqBody := anthropicRequest{
		Model:     a.Model,
		MaxTokens: 1024,
		Messages: []anthropicMessage{
			{Role: "user", Content: prompt},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", a.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	start := time.Now()
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	latency := int(time.Since(start).Milliseconds())

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
	}

	var anthropicResp anthropicResponse
	if err := json.Unmarshal(body, &anthropicResp); err != nil {
		return nil, err
	}

	if len(anthropicResp.Content) == 0 {
		return nil, fmt.Errorf("empty response from Anthropic")
	}

	text := anthropicResp.Content[0].Text

	// Basic JSON extraction
	re := regexp.MustCompile(`\{[\s\S]*\}`)
	match := re.FindString(text)
	if match == "" {
		match = text
	}

	var data struct {
		Subtopics []string `json:"subtopics"`
	}
	if err := json.Unmarshal([]byte(match), &data); err != nil {
		return nil, fmt.Errorf("failed to parse JSON from response: %v", err)
	}

	// Truncate to breadth if necessary
	if len(data.Subtopics) > breadth {
		data.Subtopics = data.Subtopics[:breadth]
	}

	return &DecomposerResponse{
		Subtopics: data.Subtopics,
		Metadata: NodeMetadata{
			Tokens:    anthropicResp.Usage.InputTokens + anthropicResp.Usage.OutputTokens,
			Model:     a.Model,
			LatencyMS: latency,
		},
	}, nil
}

func (a *AnthropicAdapter) GetModelName() string {
	return a.Model
}
