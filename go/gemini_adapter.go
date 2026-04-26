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

const geminiBaseURL = "https://generativelanguage.googleapis.com/v1beta/models"

type GeminiAdapter struct {
	apiKey, model string
}

func NewGeminiAdapter(apiKey, model string) *GeminiAdapter {
	return &GeminiAdapter{apiKey: apiKey, model: model}
}

type geminiRequest struct {
	Contents         []geminiContent  `json:"contents"`
	GenerationConfig geminiGenConfig  `json:"generationConfig"`
	SystemInstruction *geminiContent  `json:"systemInstruction,omitempty"`
}

type geminiContent struct {
	Role  string       `json:"role,omitempty"`
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenConfig struct {
	MaxOutputTokens int `json:"maxOutputTokens"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []geminiPart `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	UsageMetadata struct {
		PromptTokenCount     int `json:"promptTokenCount"`
		CandidatesTokenCount int `json:"candidatesTokenCount"`
	} `json:"usageMetadata"`
}

func (a *GeminiAdapter) Decompose(topic string, breadth int, systemPrompt string) (*DecomposerResponse, error) {
	tmpl, err := loadDecomposePrompt(systemPrompt)
	if err != nil {
		return nil, err
	}
	prompt := strings.Replace(tmpl, "{{BREADTH}}", strconv.Itoa(breadth), 1)
	prompt = strings.Replace(prompt, "{{TOPIC}}", topic, 1)

	reqBody := geminiRequest{
		Contents:         []geminiContent{{Role: "user", Parts: []geminiPart{{Text: prompt}}}},
		GenerationConfig: geminiGenConfig{MaxOutputTokens: 4096},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/%s:generateContent?key=%s", geminiBaseURL, a.model, a.apiKey)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

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
		return nil, fmt.Errorf("Gemini API error (%d): %s", resp.StatusCode, string(body))
	}

	var gemResp geminiResponse
	if err := json.Unmarshal(body, &gemResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(gemResp.Candidates) == 0 || len(gemResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("Gemini API returned empty content")
	}

	text := gemResp.Candidates[0].Content.Parts[0].Text

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
			Tokens:    gemResp.UsageMetadata.PromptTokenCount + gemResp.UsageMetadata.CandidatesTokenCount,
			Model:     a.model,
			LatencyMS: latency,
		},
	}, nil
}

func (a *GeminiAdapter) GetModelName() string {
	return a.model
}
