package intel

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"golang.org/x/net/html"
	"watchtower/feeds"
	"watchtower/weather"
)

type ToolDef struct {
	Type     string `json:"type"`
	Function struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Parameters  struct {
			Type       string                 `json:"type"`
			Properties map[string]interface{} `json:"properties"`
			Required   []string               `json:"required"`
		} `json:"parameters"`
	} `json:"function"`
}

func GetAvailableTools() []ToolDef {
	return []ToolDef{
		{
			Type: "function",
			Function: struct {
				Name        string `json:"name"`
				Description string `json:"description"`
				Parameters  struct {
					Type       string                 `json:"type"`
					Properties map[string]interface{} `json:"properties"`
					Required   []string               `json:"required"`
				} `json:"parameters"`
			}{
				Name:        "search_web",
				Description: "Search the web for up-to-date information on a specific topic. Use this to find the latest news, facts, or context.",
				Parameters: struct {
					Type       string                 `json:"type"`
					Properties map[string]interface{} `json:"properties"`
					Required   []string               `json:"required"`
				}{
					Type: "object",
					Properties: map[string]interface{}{
						"query": map[string]string{
							"type":        "string",
							"description": "The search query to look up.",
						},
					},
					Required: []string{"query"},
				},
			},
		},
		{
			Type: "function",
			Function: struct {
				Name        string `json:"name"`
				Description string `json:"description"`
				Parameters  struct {
					Type       string                 `json:"type"`
					Properties map[string]interface{} `json:"properties"`
					Required   []string               `json:"required"`
				} `json:"parameters"`
			}{
				Name:        "get_weather",
				Description: "Get the current weather conditions for a specific city.",
				Parameters: struct {
					Type       string                 `json:"type"`
					Properties map[string]interface{} `json:"properties"`
					Required   []string               `json:"required"`
				}{
					Type: "object",
					Properties: map[string]interface{}{
						"city": map[string]string{
							"type":        "string",
							"description": "The city to get weather for, e.g., 'London' or 'Delhi'.",
						},
					},
					Required: []string{"city"},
				},
			},
		},
		{
			Type: "function",
			Function: struct {
				Name        string `json:"name"`
				Description string `json:"description"`
				Parameters  struct {
					Type       string                 `json:"type"`
					Properties map[string]interface{} `json:"properties"`
					Required   []string               `json:"required"`
				} `json:"parameters"`
			}{
				Name:        "check_bias",
				Description: "Look up the funding and political bias of a specific news source/organization.",
				Parameters: struct {
					Type       string                 `json:"type"`
					Properties map[string]interface{} `json:"properties"`
					Required   []string               `json:"required"`
				}{
					Type: "object",
					Properties: map[string]interface{}{
						"source": map[string]string{
							"type":        "string",
							"description": "The name of the news organization (e.g., 'Al Jazeera', 'Fox News', 'NDTV').",
						},
					},
					Required: []string{"source"},
				},
			},
		},
		{
			Type: "function",
			Function: struct {
				Name        string `json:"name"`
				Description string `json:"description"`
				Parameters  struct {
					Type       string                 `json:"type"`
					Properties map[string]interface{} `json:"properties"`
					Required   []string               `json:"required"`
				} `json:"parameters"`
			}{
				Name:        "get_global_news",
				Description: "Fetch the latest global intelligence headlines from major RSS feeds.",
				Parameters: struct {
					Type       string                 `json:"type"`
					Properties map[string]interface{} `json:"properties"`
					Required   []string               `json:"required"`
				}{
					Type:       "object",
					Properties: map[string]interface{}{},
					Required:   []string{},
				},
			},
		},
	}
}

// ExecuteTool runs the requested tool and returns a string result
func ExecuteTool(ctx context.Context, name string, args map[string]interface{}, cfg LLMConfig) (string, error) {
	switch name {
	case "search_web":
		query, ok := args["query"].(string)
		if !ok {
			return "", fmt.Errorf("missing query parameter")
		}
		return searchDuckDuckGo(ctx, query)

	case "get_weather":
		city, ok := args["city"].(string)
		if !ok {
			return "", fmt.Errorf("missing city parameter")
		}
		// Assuming we don't have lat/lon, we use 0,0 and the weather library geocodes it if needed
		// Wait, weather.Fetch requires lat/lon for meteo if geocoding is handled there
		cond, _, err := weather.Fetch(ctx, 0, 0, city)
		if err != nil {
			return "Error fetching weather: " + err.Error(), nil
		}
		if cond == nil {
			return "Weather data unavailable for " + city, nil
		}
		return fmt.Sprintf("Conditions in %s: %.1fC, %s", city, cond.TempC, cond.Description), nil

	case "check_bias":
		source, ok := args["source"].(string)
		if !ok {
			return "", fmt.Errorf("missing source parameter")
		}
		intelData, err := GetFundingIntel(ctx, cfg, source)
		if err != nil {
			return "Error checking bias: " + err.Error(), nil
		}
		return fmt.Sprintf("Source: %s\nOwner: %s\nBias: %s\nFunding: %v",
			intelData.Source, intelData.Owner, intelData.Bias, intelData.FundingSources), nil

	case "get_global_news":
		items, err := feeds.FetchGlobalNews(ctx)
		if err != nil {
			return "Error fetching global news: " + err.Error(), nil
		}
		var sb strings.Builder
		for i, item := range items {
			if i >= 10 { // limit to top 10
				break
			}
			sb.WriteString(fmt.Sprintf("- [%s] %s (Source: %s)\n", item.ThreatLevel.String(), item.Title, item.Source))
		}
		if sb.Len() == 0 {
			return "No global news found currently.", nil
		}
		return sb.String(), nil

	default:
		return "", fmt.Errorf("unknown tool: %s", name)
	}
}

func searchDuckDuckGo(ctx context.Context, query string) (string, error) {
	searchURL := "https://html.duckduckgo.com/html/?q=" + url.QueryEscape(query)
	req, _ := http.NewRequestWithContext(ctx, "GET", searchURL, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "Search failed: " + err.Error(), nil
	}
	defer resp.Body.Close()

	doc, err := html.Parse(resp.Body)
	if err != nil {
		return "Failed to parse search results", nil
	}

	var results []string
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			for _, a := range n.Attr {
				if a.Key == "class" && strings.Contains(a.Val, "result__snippet") {
					snippet := extractText(n)
					if snippet != "" {
						results = append(results, snippet)
					}
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	if len(results) == 0 {
		return "No results found for query: " + query, nil
	}

	var sb strings.Builder
	for i, r := range results {
		if i >= 5 { // Limit to top 5 results
			break
		}
		sb.WriteString(fmt.Sprintf("%d. %s\n", i+1, r))
	}
	return sb.String(), nil
}

func extractText(n *html.Node) string {
	var text string
	if n.Type == html.TextNode {
		text = n.Data
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		text += extractText(c)
	}
	return strings.TrimSpace(text)
}
