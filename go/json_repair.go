package hydra

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

var codeFenceRe = regexp.MustCompile("(?s)```(?:json)?\\s*\\n?(.*?)\\n?\\s*```")

func ExtractJSON(text string, target interface{}) error {
	if text = strings.TrimSpace(text); text == "" {
		return fmt.Errorf("empty input: no JSON to extract")
	}

	if m := codeFenceRe.FindStringSubmatch(text); len(m) > 1 {
		text = strings.TrimSpace(m[1])
	}

	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start == -1 || end == -1 || end <= start {
		return fmt.Errorf("no JSON object found in text")
	}
	text = text[start : end+1]

	if err := json.Unmarshal([]byte(text), target); err == nil {
		return nil
	}

	repaired := repairTrailingCommas(text)
	if err := json.Unmarshal([]byte(repaired), target); err != nil {
		return fmt.Errorf("failed to parse JSON after repair: %w", err)
	}
	return nil
}

var trailingCommaRe = regexp.MustCompile(`,\s*([}\]])`)

func repairTrailingCommas(s string) string {
	return trailingCommaRe.ReplaceAllString(s, "$1")
}
