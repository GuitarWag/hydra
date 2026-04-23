package hydra

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
)

type EvalCase struct {
	Name           string
	Prompt         string
	ExpectedTopics []string // keywords the judge should find covered
	MinSubtopics   int
}

var evalCases = []EvalCase{
	{
		Name:           "EV vs hydrogen",
		Prompt:         "Compare electric vehicles versus hydrogen fuel cells for environmental impact.",
		ExpectedTopics: []string{"electric vehicles", "hydrogen", "environmental"},
		MinSubtopics:   2,
	},
	{
		Name:           "Remote work effects",
		Prompt:         "What are the effects of remote work on productivity and mental health?",
		ExpectedTopics: []string{"remote work", "productivity", "mental health"},
		MinSubtopics:   2,
	},
}

type JudgeVerdict struct {
	Coverage     int    `json:"coverage"`
	Distinctness int    `json:"distinctness"`
	Relevance    int    `json:"relevance"`
	Granularity  int    `json:"granularity"`
	Pass         bool   `json:"pass"`
	Reasoning    string `json:"reasoning"`
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func callJudge(apiKey, judgeModel, originalPrompt string, subtopics, expectedTopics []string) (*JudgeVerdict, error) {
	prompt := fmt.Sprintf(`You are an evaluation judge for a topic decomposition system called Hydra.
The system receives a compound question and breaks it into distinct subtopics.

ORIGINAL QUESTION:
%s

DECOMPOSED SUBTOPICS:
%s

EXPECTED TOPIC AREAS (for reference, not exhaustive):
%s

Score the decomposition on four criteria (1-5 each):
- coverage: Do the subtopics collectively address all major aspects of the compound question?
- distinctness: Are the subtopics non-overlapping and each focused on a different aspect?
- relevance: Is every subtopic directly relevant to the original question (no tangents)?
- granularity: Are subtopics at an appropriate level of specificity (not too broad, not too narrow)?

A decomposition passes if ALL scores are >= 3 and the average is >= 3.5.

Return ONLY a JSON object:
{"coverage": N, "distinctness": N, "relevance": N, "granularity": N, "pass": true/false, "reasoning": "brief explanation"}`,
		originalPrompt,
		formatSubtopics(subtopics),
		strings.Join(expectedTopics, ", "),
	)

	reqBody := anthropicRequest{
		Model:     judgeModel,
		MaxTokens: 512,
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
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("judge API error (%d): %s", resp.StatusCode, string(body))
	}

	var anthropicResp anthropicResponse
	if err := json.Unmarshal(body, &anthropicResp); err != nil {
		return nil, err
	}

	if len(anthropicResp.Content) == 0 {
		return nil, fmt.Errorf("empty judge response")
	}

	text := anthropicResp.Content[0].Text

	// Extract JSON from response
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start == -1 || end == -1 || end <= start {
		return nil, fmt.Errorf("no JSON in judge response: %s", text)
	}

	var verdict JudgeVerdict
	if err := json.Unmarshal([]byte(text[start:end+1]), &verdict); err != nil {
		return nil, fmt.Errorf("failed to parse judge verdict: %v\nraw: %s", err, text)
	}

	return &verdict, nil
}

func formatSubtopics(subtopics []string) string {
	var b strings.Builder
	for i, s := range subtopics {
		fmt.Fprintf(&b, "%d. %s\n", i+1, s)
	}
	return b.String()
}

func collectSubtopics(node *HydraNode) []string {
	var topics []string
	for _, child := range node.Children {
		topics = append(topics, child.Topic)
	}
	return topics
}

func adapterForModel(model, anthropicKey, openaiKey, openaiBaseURL string) Adapter {
	if strings.HasPrefix(model, "claude-") {
		return NewAnthropicAdapter(anthropicKey, model)
	}
	return NewOpenAIAdapter(openaiKey, model, openaiBaseURL)
}

func TestEvalDecomposition(t *testing.T) {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		t.Skip("ANTHROPIC_API_KEY not set, skipping eval")
	}

	evalModel := getEnvOrDefault("HYDRA_EVAL_MODEL", "claude-haiku-4-5-20251001")
	judgeModel := getEnvOrDefault("HYDRA_JUDGE_MODEL", "claude-haiku-4-5-20251001")
	openaiKey := os.Getenv("OPENAI_API_KEY")
	openaiBaseURL := os.Getenv("OPENAI_BASE_URL")

	t.Logf("Decomposer model: %s", evalModel)
	t.Logf("Judge model: %s", judgeModel)

	adapter := adapterForModel(evalModel, apiKey, openaiKey, openaiBaseURL)

	passed := 0
	failed := 0

	for _, tc := range evalCases {
		t.Run(tc.Name, func(t *testing.T) {
			engine := NewHydraEngine(HydraConfig{
				DepthLimit:      1,
				BranchingFactor: 4,
				Adapter:         adapter,
			})

			root, err := engine.Run(tc.Prompt)
			if err != nil {
				t.Fatalf("engine failed: %v", err)
			}

			subtopics := collectSubtopics(root)
			t.Logf("Subtopics: %v", subtopics)

			if len(subtopics) < tc.MinSubtopics {
				t.Errorf("expected >= %d subtopics, got %d", tc.MinSubtopics, len(subtopics))
			}

			verdict, err := callJudge(apiKey, judgeModel, tc.Prompt, subtopics, tc.ExpectedTopics)
			if err != nil {
				t.Fatalf("judge call failed: %v", err)
			}

			t.Logf("Scores — coverage:%d distinctness:%d relevance:%d granularity:%d",
				verdict.Coverage, verdict.Distinctness, verdict.Relevance, verdict.Granularity)
			t.Logf("Reasoning: %s", verdict.Reasoning)

			if !verdict.Pass {
				failed++
				t.Errorf("FAIL: %s", verdict.Reasoning)
			} else {
				passed++
			}
		})
	}

	t.Logf("\n=== EVAL SUMMARY: %d/%d passed, %d/%d failed ===", passed, len(evalCases), failed, len(evalCases))
}

func TestEvalMatrix(t *testing.T) {
	anthropicKey := os.Getenv("ANTHROPIC_API_KEY")
	openaiKey := os.Getenv("OPENAI_API_KEY")
	openaiBaseURL := os.Getenv("OPENAI_BASE_URL")

	modelsEnv := os.Getenv("HYDRA_EVAL_MODELS")
	if modelsEnv == "" {
		t.Skip("HYDRA_EVAL_MODELS not set (comma-separated model list), skipping matrix eval")
	}

	judgeModel := getEnvOrDefault("HYDRA_JUDGE_MODEL", "claude-haiku-4-5-20251001")
	if anthropicKey == "" {
		t.Skip("ANTHROPIC_API_KEY not set (needed for judge), skipping matrix eval")
	}

	models := strings.Split(modelsEnv, ",")
	for i := range models {
		models[i] = strings.TrimSpace(models[i])
	}

	type ModelResult struct {
		Model                                                string
		Passed, Failed                                       int
		AvgCoverage, AvgDistinctness, AvgRelevance, AvgGran float64
	}

	var results []ModelResult

	for _, model := range models {
		t.Run(model, func(t *testing.T) {
			adapter := adapterForModel(model, anthropicKey, openaiKey, openaiBaseURL)

			passed, failed := 0, 0
			totalCov, totalDist, totalRel, totalGran := 0, 0, 0, 0

			for _, tc := range evalCases {
				t.Run(tc.Name, func(t *testing.T) {
					engine := NewHydraEngine(HydraConfig{
						DepthLimit:      1,
						BranchingFactor: 4,
						Adapter:         adapter,
					})

					root, err := engine.Run(tc.Prompt)
					if err != nil {
						t.Fatalf("engine failed: %v", err)
					}

					subtopics := collectSubtopics(root)
					t.Logf("Subtopics: %v", subtopics)

					verdict, err := callJudge(anthropicKey, judgeModel, tc.Prompt, subtopics, tc.ExpectedTopics)
					if err != nil {
						t.Fatalf("judge call failed: %v", err)
					}

					t.Logf("Scores — coverage:%d distinctness:%d relevance:%d granularity:%d",
						verdict.Coverage, verdict.Distinctness, verdict.Relevance, verdict.Granularity)

					totalCov += verdict.Coverage
					totalDist += verdict.Distinctness
					totalRel += verdict.Relevance
					totalGran += verdict.Granularity

					if !verdict.Pass {
						failed++
						t.Errorf("FAIL: %s", verdict.Reasoning)
					} else {
						passed++
					}
				})
			}

			n := float64(len(evalCases))
			result := ModelResult{
				Model:           model,
				Passed:          passed,
				Failed:          failed,
				AvgCoverage:     float64(totalCov) / n,
				AvgDistinctness: float64(totalDist) / n,
				AvgRelevance:    float64(totalRel) / n,
				AvgGran:         float64(totalGran) / n,
			}
			results = append(results, result)

			t.Logf("\n=== %s: %d/10 passed | avg cov:%.1f dist:%.1f rel:%.1f gran:%.1f ===",
				model, passed, result.AvgCoverage, result.AvgDistinctness, result.AvgRelevance, result.AvgGran)
		})
	}

	t.Log("\n╔══════════════════════════════════════════════════════════════════════════╗")
	t.Log("║                         EVAL MATRIX RESULTS                            ║")
	t.Log("╠══════════════════════════════════════════════════════════════════════════╣")
	t.Logf("║ %-30s │ Pass │ Cov  │ Dist │ Rel  │ Gran ║", "Model")
	t.Log("╠──────────────────────────────────────────────────────────────────────────╣")
	for _, r := range results {
		t.Logf("║ %-30s │ %2d/10│ %3.1f  │ %3.1f  │ %3.1f  │ %3.1f  ║",
			r.Model, r.Passed, r.AvgCoverage, r.AvgDistinctness, r.AvgRelevance, r.AvgGran)
	}
	t.Log("╚══════════════════════════════════════════════════════════════════════════╝")
}
