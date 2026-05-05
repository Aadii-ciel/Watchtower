package intel

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// AgentMessage represents a message in the conversation
type AgentMessage struct {
	Role       string      `json:"role"`
	Content    string      `json:"content,omitempty"`
	Name       string      `json:"name,omitempty"`
	ToolCalls  []ToolCall  `json:"tool_calls,omitempty"`
	ToolCallID string      `json:"tool_call_id,omitempty"`
}

type ToolCall struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Function struct {
		Name      string `json:"name"`
		Arguments string `json:"arguments"`
	} `json:"function"`
}

// AgentResponse handles streaming responses and tool events
type AgentResponse struct {
	Type    string `json:"type"`    // "message", "tool_start", "tool_end", "error"
	Content string `json:"content"` // The delta text, or tool name
	Data    string `json:"data"`    // Additional data, e.g. tool result
}

// RunAgent executes a conversation loop, allowing the agent to call tools
// It streams AgentResponse objects to a channel so the UI can show real-time actions.
func RunAgent(ctx context.Context, cfg LLMConfig, history []AgentMessage, persona string, outChan chan<- AgentResponse) error {
	defer close(outChan)

	systemPrompt := fmt.Sprintf(`You are an expert %s working for Watchtower Intelligence. 
You have access to real-time tools. If you need data, call the appropriate tool. 
Always provide detailed, professional, and well-reasoned answers based on the tool results.
If you don't know the answer, use the web search tool to find out.`, persona)

	// Ensure system prompt is at the start
	messages := []AgentMessage{{Role: "system", Content: systemPrompt}}
	messages = append(messages, history...)

	for {
		reqBody := map[string]interface{}{
			"model":    cfg.Model,
			"messages": messages,
			"tools":    GetAvailableTools(),
			"stream":   false, // Keep it simple and sync for tool calling loop
		}

		jsonData, err := json.Marshal(reqBody)
		if err != nil {
			return err
		}

		endpoint := "http://localhost:11434/v1/chat/completions"
		if cfg.Provider == ProviderOpenAI {
			endpoint = "https://api.openai.com/v1/chat/completions"
		}

		req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(jsonData))
		if err != nil {
			return err
		}
		req.Header.Set("Content-Type", "application/json")
		if cfg.APIKey != "" {
			req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
		}

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			outChan <- AgentResponse{Type: "error", Content: err.Error()}
			return err
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode != 200 {
			outChan <- AgentResponse{Type: "error", Content: fmt.Sprintf("API Error (%d): %s", resp.StatusCode, string(bodyBytes))}
			return fmt.Errorf("API error: %s", string(bodyBytes))
		}

		var result struct {
			Choices []struct {
				Message      AgentMessage `json:"message"`
				FinishReason string       `json:"finish_reason"`
			} `json:"choices"`
		}

		if err := json.Unmarshal(bodyBytes, &result); err != nil {
			outChan <- AgentResponse{Type: "error", Content: "Failed to parse LLM response"}
			return err
		}

		if len(result.Choices) == 0 {
			outChan <- AgentResponse{Type: "error", Content: "Empty LLM response"}
			return fmt.Errorf("empty response")
		}

		respMsg := result.Choices[0].Message
		messages = append(messages, respMsg)

		// Did the agent decide to call a tool?
		if len(respMsg.ToolCalls) > 0 {
			for _, tc := range respMsg.ToolCalls {
				outChan <- AgentResponse{
					Type:    "tool_start",
					Content: tc.Function.Name,
					Data:    tc.Function.Arguments,
				}

				var args map[string]interface{}
				json.Unmarshal([]byte(tc.Function.Arguments), &args)

				toolResult, err := ExecuteTool(ctx, tc.Function.Name, args, cfg)
				if err != nil {
					toolResult = "Error: " + err.Error()
				}

				outChan <- AgentResponse{
					Type:    "tool_end",
					Content: tc.Function.Name,
					Data:    toolResult,
				}

				// Append tool result to messages
				messages = append(messages, AgentMessage{
					Role:       "tool",
					Content:    toolResult,
					ToolCallID: tc.ID,
					Name:       tc.Function.Name,
				})
			}
			// After tool results are added, loop repeats to get the final synthesis from LLM
			continue
		}

		// If no tools were called, the agent has finished formulating its answer
		outChan <- AgentResponse{
			Type:    "message",
			Content: respMsg.Content,
		}
		break
	}

	return nil
}
