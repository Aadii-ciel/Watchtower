# 🌍 Watchtower

A modern, minimal global intelligence dashboard summarizing local weather, global news, and financial markets into one scannable view.

> **Note:** Watchtower was originally conceived as a Terminal UI (TUI) application. It has since evolved into a powerful web application with a **Go backend** and a **React frontend**. 
> 
> For comprehensive details on features, tech stack, and setup, please see the full [DOCUMENTATION.md](DOCUMENTATION.md).

## Features

- **Global News & Local Intel**: Aggregates 100+ RSS feeds mapped with Threat Levels (Critical, High, Medium, Low).
- **Markets**: Live crypto, stocks, commodities, and Polymarket prediction insights in a flash.
- **AI Intelligence Briefs**: Generates concise, LLM-powered Situation Reports (Sitreps) for your global and local spheres without the fluff.
- **Local Weather Tracker**: Leverages the Open-Meteo API to bring 14-day forecasts and current conditions to your fingertips.

## Quick Start

You will need to run the Go backend and the React frontend concurrently.

#### 1. Backend API (Go)
```bash
git clone https://github.com/lajosdeme/watchtower
cd watchtower
go mod tidy
go run main.go
```
The backend initializes on `http://localhost:8080`.

#### 2. Frontend Web App (React)
Open a new terminal session:
```bash
cd watchtower/frontend
npm install
npm run dev
```
The frontend launches on `http://localhost:5173`. Access this URL in your browser to view your dashboard!

## Contributing

Contributions are welcome! Please format your code (`go fmt ./` or `npm run lint`) before submitting Pull Requests.

## License

MIT License — see [LICENSE](LICENSE) for details.
