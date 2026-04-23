package hydra

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const defaultOpenAIBaseURL = "https://api.openai.com/v1"

type OpenAIAdapter struct {
	apiKey, model, baseURL string
}

func NewOpenAIAdapter(apiKey, model, baseURL string) *OpenAIAdapter {
	if baseURL == "" {
		baseURL = defaultOpenAIBaseURL
	}
	baseURL = strings.TrimRight(baseURL, "/")
	return &OpenAIAdapter{
		apiKey:  apiKey,
		model:   model,
		baseURL: baseURL,
	}
}

type openAIChatRequest struct {
	Model    string          `json:"model"`
	Messages []openAIMessage `json:"messages"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
	} `json:"usage"`
}

func (a *OpenAIAdapter) Decompose(topic string, breadth int) (*DecomposerResponse, error) {
	tmpl, err := loadDecomposePrompt()
	if err != nil {
		return nil, err
	}
	prompt := strings.Replace(tmpl, "{{BREADTH}}", strconv.Itoa(breadth), 1)
	prompt = strings.Replace(prompt, "{{TOPIC}}", topic, 1)

	reqBody := openAIChatRequest{
		Model: a.model,
		Messages: []openAIMessage{
			{Role: "user", Content: prompt},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	endpoint := a.baseURL + "/chat/completions"
	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+a.apiKey)

	start := time.Now()
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	latency := int(time.Since(start).Milliseconds())

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
	}

	var chatResp openAIChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return nil, fmt.Errorf("empty response: no choices returned")
	}

	text := chatResp.Choices[0].Message.Content

	var data struct {
		Subtopics []string `json:"subtopics"`
	}
	if err := ExtractJSON(text, &data); err != nil {
		return nil, fmt.Errorf("failed to extract JSON from response: %w", err)
	}

	if len(data.Subtopics) > breadth {
		data.Subtopics = data.Subtopics[:breadth]
	}

	return &DecomposerResponse{
		Subtopics: data.Subtopics,
		Metadata: NodeMetadata{
			Tokens:    chatResp.Usage.PromptTokens + chatResp.Usage.CompletionTokens,
			Model:     a.model,
			LatencyMS: latency,
		},
	}, nil
}

func (a *OpenAIAdapter) GetModelName() string {
	return a.model
}
