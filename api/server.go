package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"watchtower/config"
	"watchtower/feeds"
	"watchtower/intel"
	"watchtower/markets"
	"watchtower/weather"
)

type Server struct {
	cfg *config.Config
	mux *http.ServeMux
}

func NewServer(cfg *config.Config) *Server {
	s := &Server{
		cfg: cfg,
		mux: http.NewServeMux(),
	}
	s.routes()
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Basic CORS and No-Cache handling
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	s.mux.ServeHTTP(w, r)
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

func (s *Server) routes() {
	s.mux.HandleFunc("/api/config", s.handleConfig)
	s.mux.HandleFunc("/api/news/global", s.handleGlobalNews)
	s.mux.HandleFunc("/api/news/local", s.handleLocalNews)
	s.mux.HandleFunc("/api/markets/crypto", s.handleCrypto)
	s.mux.HandleFunc("/api/markets/stocks", s.handleStocks)
	s.mux.HandleFunc("/api/markets/commodities", s.handleCommodities)
	s.mux.HandleFunc("/api/markets/polymarket", s.handlePolymarket)
	s.mux.HandleFunc("/api/weather", s.handleWeather)
	s.mux.HandleFunc("/api/intel/brief", s.handleIntelBrief)
	s.mux.HandleFunc("/api/intel/local-brief", s.handleIntelLocalBrief)
	s.mux.HandleFunc("/api/intel/funding", s.handleFundingIntel)
	s.mux.HandleFunc("/api/agent/chat", s.handleAgentChat)
}

func (s *Server) handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		respondJSON(w, http.StatusOK, s.cfg)
		return
	}

	if r.Method == "POST" {
		var newCfg config.Config
		if err := json.NewDecoder(r.Body).Decode(&newCfg); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid JSON payload")
			return
		}

		if err := config.Save(&newCfg); err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to save config: "+err.Error())
			return
		}

		*s.cfg = newCfg
		respondJSON(w, http.StatusOK, map[string]string{"status": "success"})
		return
	}

	respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
}

func (s *Server) handleGlobalNews(w http.ResponseWriter, r *http.Request) {
	items, err := feeds.FetchGlobalNews(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, items)
}

func (s *Server) handleLocalNews(w http.ResponseWriter, r *http.Request) {
	city := r.URL.Query().Get("city")
	country := r.URL.Query().Get("country")
	if city == "" {
		city = s.cfg.Location.City
	}
	if country == "" {
		country = s.cfg.Location.Country
	}

	items, err := feeds.FetchLocalNews(r.Context(), city, country)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, items)
}

func (s *Server) handleCrypto(w http.ResponseWriter, r *http.Request) {
	pairs := s.cfg.CryptoPairs
	if p := r.URL.Query().Get("pairs"); p != "" {
		pairs = strings.Split(p, ",")
	}
	prices, err := markets.FetchCryptoPrices(r.Context(), pairs)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, prices)
}

func (s *Server) handleStocks(w http.ResponseWriter, r *http.Request) {
	indices, err := markets.FetchStockIndices(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, indices)
}

func (s *Server) handleCommodities(w http.ResponseWriter, r *http.Request) {
	commodities, err := markets.FetchCommodities(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, commodities)
}

func (s *Server) handlePolymarket(w http.ResponseWriter, r *http.Request) {
	mkts, err := markets.FetchPredictionMarkets(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, mkts)
}

func (s *Server) handleWeather(w http.ResponseWriter, r *http.Request) {
	latStr := r.URL.Query().Get("lat")
	lonStr := r.URL.Query().Get("lon")
	city := r.URL.Query().Get("city")

	lat := s.cfg.Location.Latitude
	lon := s.cfg.Location.Longitude
	if city == "" {
		city = s.cfg.Location.City
	}

	if latStr != "" && lonStr != "" {
		if l, err := strconv.ParseFloat(latStr, 64); err == nil {
			lat = l
		}
		if l, err := strconv.ParseFloat(lonStr, 64); err == nil {
			lon = l
		}
	}

	cond, forecast, err := weather.Fetch(r.Context(), lat, lon, city)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"conditions": cond,
		"forecast":   forecast,
	})
}

// Request payload for briefs
type briefRequest struct {
	News         []feeds.NewsItem      `json:"news"`
	ForceRefresh bool                  `json:"force_refresh"`
}

type localBriefRequest struct {
	City         string                `json:"city"`
	News         []feeds.NewsItem      `json:"news"`
	Conditions   *weather.Conditions   `json:"conditions"`
	Forecast     []weather.DayForecast `json:"forecast"`
	ForceRefresh bool                  `json:"force_refresh"`
}

func (s *Server) getLLMConfig() intel.LLMConfig {
	return intel.LLMConfig{
		Provider: intel.Provider(s.cfg.LLMProvider),
		APIKey:   s.cfg.LLMAPIKey,
		Model:    s.cfg.LLMModel,
	}
}

func (s *Server) handleIntelBrief(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if s.cfg.LLMAPIKey == "" && s.cfg.LLMProvider != "local" {
		respondError(w, http.StatusBadRequest, "LLM API Key not configured")
		return
	}

	var req briefRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// If payload missing/invalid, fetch news ourselves
		items, err := feeds.FetchGlobalNews(r.Context())
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to fetch news: "+err.Error())
			return
		}
		req.News = items
	}

	cacheMins := s.cfg.BriefCacheMins
	if !req.ForceRefresh && cacheMins > 0 {
		maxAge := time.Duration(cacheMins) * time.Minute
		if cached, err := intel.LoadCachedBrief(maxAge); err == nil && cached != nil {
			respondJSON(w, http.StatusOK, cached)
			return
		}
	}

	b, err := intel.GenerateBrief(r.Context(), s.getLLMConfig(), req.News)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	intel.SaveCachedBrief(b)
	respondJSON(w, http.StatusOK, b)
}

func (s *Server) handleIntelLocalBrief(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if s.cfg.LLMAPIKey == "" && s.cfg.LLMProvider != "local" {
		respondError(w, http.StatusBadRequest, "LLM API Key not configured")
		return
	}

	var req localBriefRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.City == "" {
		req.City = s.cfg.Location.City
	}

	cacheMins := s.cfg.BriefCacheMins
	if !req.ForceRefresh && cacheMins > 0 {
		maxAge := time.Duration(cacheMins) * time.Minute
		if cached, err := intel.LoadCachedLocalBrief(maxAge); err == nil && cached != nil {
			respondJSON(w, http.StatusOK, cached)
			return
		}
	}

	b, err := intel.GenerateLocalBrief(r.Context(), s.getLLMConfig(), req.City, req.News, req.Conditions, req.Forecast)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	intel.SaveCachedLocalBrief(b)
	respondJSON(w, http.StatusOK, b)
}

func (s *Server) handleFundingIntel(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	source := r.URL.Query().Get("source")
	if source == "" {
		respondError(w, http.StatusBadRequest, "source parameter is required")
		return
	}

	intelData, err := intel.GetFundingIntel(r.Context(), s.getLLMConfig(), source)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, intelData)
}

func (s *Server) handleAgentChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Persona string               `json:"persona"`
		History []intel.AgentMessage `json:"history"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Persona == "" {
		req.Persona = "General Intelligence Analyst"
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		respondError(w, http.StatusInternalServerError, "Streaming unsupported")
		return
	}

	outChan := make(chan intel.AgentResponse)

	go func() {
		err := intel.RunAgent(r.Context(), s.getLLMConfig(), req.History, req.Persona, outChan)
		if err != nil {
			fmt.Printf("Agent run error: %v\n", err)
		}
	}()

	for resp := range outChan {
		jsonData, _ := json.Marshal(resp)
		fmt.Fprintf(w, "data: %s\n\n", string(jsonData))
		flusher.Flush()
	}
}
