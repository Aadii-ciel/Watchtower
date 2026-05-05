package intel

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type FundingSource struct {
	Name       string `json:"name"`
	Percentage int    `json:"percentage"`
}

type FundingIntel struct {
	Source         string          `json:"source"`
	Owner          string          `json:"owner"`
	Type           string          `json:"type"`
	Bias           string          `json:"bias"`
	Description    string          `json:"description"`
	FundingSources []FundingSource `json:"funding_sources"`
}

var (
	fundingDB   map[string]FundingIntel
	fundingLock sync.RWMutex
	fundingPath = "data/funding.json"
)

func init() {
	fundingDB = make(map[string]FundingIntel)
	loadFundingDB()
}

func loadFundingDB() {
	fundingLock.Lock()
	defer fundingLock.Unlock()

	data, err := os.ReadFile(fundingPath)
	if err != nil {
		return
	}
	json.Unmarshal(data, &fundingDB)
}

func saveFundingDB() {
	fundingLock.RLock()
	defer fundingLock.RUnlock()

	os.MkdirAll(filepath.Dir(fundingPath), 0755)
	data, _ := json.MarshalIndent(fundingDB, "", "  ")
	os.WriteFile(fundingPath, data, 0644)
}

func GetFundingIntel(ctx context.Context, cfg LLMConfig, source string) (*FundingIntel, error) {
	normalized := strings.ToLower(strings.TrimSpace(source))
	if normalized == "" {
		return nil, fmt.Errorf("empty source")
	}

	fundingLock.RLock()
	intel, exists := fundingDB[normalized]
	fundingLock.RUnlock()

	if exists {
		return &intel, nil
	}

	// AI Fallback
	if cfg.APIKey == "" || cfg.Provider == "" {
		return nil, fmt.Errorf("source not found and LLM is not fully configured")
	}

	prompt := fmt.Sprintf(`You are an expert media analyst. Provide the financial ownership and funding structure for the news outlet "%s".
Respond in EXACTLY this JSON format with NO markdown formatting, NO extra text:
{
  "source": "%s",
  "owner": "<Parent Company or Owner Name>",
  "type": "<e.g., State-Owned, Corporate, Independent>",
  "bias": "<e.g., Left-Center, Right, Least Biased, Mixed>",
  "description": "<2-3 sentences explaining their business model and funding>",
  "funding_sources": [
    { "name": "<e.g., Advertising, State Funding, Subscriptions>", "percentage": <0-100> }
  ]
}`, source, source)

	rawJSON, err := generateRaw(ctx, cfg, "You are a data-driven media analyst.", prompt)
	if err != nil {
		return nil, err
	}

	// Clean up potential markdown formatting from LLM (e.g. ```json)
	cleaned := strings.TrimSpace(rawJSON)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	var newIntel FundingIntel
	if err := json.Unmarshal([]byte(cleaned), &newIntel); err != nil {
		return nil, fmt.Errorf("failed to parse AI response as JSON: %w (Response: %s)", err, cleaned)
	}

	// Save to DB
	fundingLock.Lock()
	fundingDB[normalized] = newIntel
	fundingLock.Unlock()
	saveFundingDB()

	return &newIntel, nil
}

// generateRaw is a generic helper to just get raw text from the configured LLM
func generateRaw(ctx context.Context, cfg LLMConfig, system, prompt string) (string, error) {
	if cfg.Provider == ProviderClaude {
		return rawClaude(ctx, cfg, system, prompt)
	}
	if cfg.Provider == ProviderGemini {
		return rawGemini(ctx, cfg, prompt)
	}
	return rawOpenAI(ctx, cfg, system, prompt)
}

func rawOpenAI(ctx context.Context, cfg LLMConfig, system, prompt string) (string, error) {
	body := map[string]interface{}{
		"model":       cfg.ModelName(),
		"temperature": 0,
		"messages": []map[string]string{
			{"role": "system", "content": system},
			{"role": "user", "content": prompt},
		},
	}
	return doRawRequest(ctx, cfg, body, func(respBody []byte) (string, error) {
		var res struct {
			Choices []struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			} `json:"choices"`
		}
		if err := json.Unmarshal(respBody, &res); err != nil {
			return "", err
		}
		if len(res.Choices) == 0 {
			return "", fmt.Errorf("no choices returned")
		}
		return res.Choices[0].Message.Content, nil
	})
}

func rawClaude(ctx context.Context, cfg LLMConfig, system, prompt string) (string, error) {
	body := map[string]interface{}{
		"model":       cfg.ModelName(),
		"max_tokens":  1000,
		"temperature": 0,
		"system":      system,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
	}
	return doRawRequest(ctx, cfg, body, func(respBody []byte) (string, error) {
		var res struct {
			Content []struct {
				Text string `json:"text"`
			} `json:"content"`
		}
		if err := json.Unmarshal(respBody, &res); err != nil {
			return "", err
		}
		if len(res.Content) == 0 {
			return "", fmt.Errorf("no content returned")
		}
		return res.Content[0].Text, nil
	})
}

func rawGemini(ctx context.Context, cfg LLMConfig, prompt string) (string, error) {
	body := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature": 0,
		},
	}
	return doRawRequest(ctx, cfg, body, func(respBody []byte) (string, error) {
		var res struct {
			Candidates []struct {
				Content struct {
					Parts []struct {
						Text string `json:"text"`
					} `json:"parts"`
				} `json:"content"`
			} `json:"candidates"`
		}
		if err := json.Unmarshal(respBody, &res); err != nil {
			return "", err
		}
		if len(res.Candidates) == 0 || len(res.Candidates[0].Content.Parts) == 0 {
			return "", fmt.Errorf("no text returned")
		}
		return res.Candidates[0].Content.Parts[0].Text, nil
	})
}

func doRawRequest(ctx context.Context, cfg LLMConfig, body interface{}, parser func([]byte) (string, error)) (string, error) {
	bodyBytes, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, "POST", cfg.Endpoint(), bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set(cfg.AuthHeader(), cfg.AuthValue())
	req.Header.Set("Content-Type", "application/json")
	if cfg.Provider == ProviderClaude {
		req.Header.Set("anthropic-version", "2023-06-01")
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var buf bytes.Buffer
	buf.ReadFrom(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("%s HTTP %d: %s", cfg.Provider, resp.StatusCode, buf.String())
	}

	return parser(buf.Bytes())
}
