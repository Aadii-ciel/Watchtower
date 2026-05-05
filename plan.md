# Watchtower: Web App Conversion Plan

## 🌍 Project Overview
Watchtower is a clean, minimal global intelligence dashboard. Originally built as a Terminal UI (TUI) application in Go, the project is currently being converted into a modern web application consisting of a **React frontend** and a **Go REST API backend**.

The core intelligence logic—fetching global/local news RSS feeds, crypto prices, stock indices, prediction markets, weather data, and utilizing LLMs for AI summaries—remains entirely in Go.

## 🛠️ Current State (Backend Ready)
The Go application has been refactored. The old TUI (`ui/` package) has been bypassed. `main.go` now initializes a standard HTTP server that serves JSON REST APIs.

### Running the Backend
Ensure you have Go installed, then from the root directory:
```bash
go mod tidy
go run main.go
```
The API server will start on `http://localhost:8080`. Basic CORS is enabled for development.

### Available REST APIs
The backend exposes the following endpoints under `http://localhost:8080`:

#### GET Requests
- `/api/config`: Returns the current user configuration (city, LLM provider, etc.).
- `/api/news/global`: Returns an array of global news items with threat levels.
- `/api/news/local`: Returns local news items (accepts optional `?city=...&country=...` query params).
- `/api/markets/crypto`: Returns prices and 24h changes for configured crypto pairs.
- `/api/markets/stocks`: Returns major stock indices.
- `/api/markets/commodities`: Returns prices for oil, gold, etc.
- `/api/markets/polymarket`: Returns active prediction markets and their probabilities.
- `/api/weather`: Returns current conditions and forecasts (accepts optional `?lat=...&lon=...&city=...`).

#### POST Requests (AI Generation)
- `/api/intel/brief`: Generates an AI summary of global news.
  - **Payload:** `{"news": [/* array of news items */], "force_refresh": false}`
- `/api/intel/local-brief`: Generates an AI summary of local conditions.
  - **Payload:** `{"city": "Delhi", "news": [], "conditions": {}, "forecast": [], "force_refresh": false}`

---

## 💻 Instructions for Building the Frontend
*(To be fed into an AI IDE or Code Agent like Antigravity, Cursor, or Windsurf)*

**Goal:** Create a modern, dark-mode React web application that consumes the Go REST APIs and replicates/enhances the original dashboard experience.

### Tech Stack Recommendation
- React (scaffolded via Vite with TypeScript)
- Tailwind CSS for styling
- `lucide-react` for icons
- `swr` or React Query for data fetching and polling (optional but recommended)

### Core Features & Layout
The frontend should feature a clean, terminal-inspired (or modern dark mode) aesthetic with a tabbed interface:

1.  **Overview Tab (The 2x2 Grid):**
    - **Top-Left:** Weather Panel (Current temp, conditions, short forecast).
    - **Top-Right:** Intel Brief Panel (Displays the AI-generated global summary. Needs a "Generate Brief" button that hits the POST endpoint).
    - **Bottom-Left:** Markets Panel (Crypto prices, Stocks, Commodities).
    - **Bottom-Right:** Prediction Markets Panel (Polymarket yes/no percentages).

2.  **Global News Tab:**
    - A list of news articles showing the Threat Level badge (Critical, High, Medium, Low), Source, Time, and Title.
    - Ideally, include a "Country Risk Index" visualization at the top if the intel brief has generated country risks.

3.  **Local Tab:**
    - Detailed weather view for the configured city.
    - Local News articles list.
    - Local AI Intel Brief generation button and display.

### Development Setup Note
When configuring Vite (`vite.config.ts`), set up a proxy to route `/api` requests to the Go backend to avoid any remaining CORS or routing issues:
```typescript
export default defineConfig({
  // ... plugins
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
```

### Next Steps for the Agent
1. Create a `frontend` folder.
2. Initialize the React/Vite app.
3. Build the layout skeleton (Sidebar/Tabs + Main Content Area).
4. Create data fetching hooks mapping to the endpoints listed above.
5. Build the UI components to visualize the JSON data.