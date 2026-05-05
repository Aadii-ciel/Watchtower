# Watchtower Documentation

Welcome to Watchtower! This document outlines everything you need to know about the architecture, features, and setup of the Watchtower Global Intelligence Dashboard.

## 🌟 Overview

Watchtower is a modern, dark-mode web application designed to act as your personal global and local intelligence dashboard. Originally built and conceptualized as a Terminal UI (TUI) application, it recently underwent a complete architectural overhaul. Today, it features a blazingly fast **Go Backend** that powers a sleek, minimal **React Frontend**.

## 🚀 Features

Watchtower aggregates the massive volume of information on the internet into actionable, scannable intelligence:

1.  **Global Intelligence Feed**: Aggregates news from over 100 RSS feeds. Every article is classified and color-coded with a Threat Level (Critical, High, Medium, Low) so you know exactly what requires your immediate attention.
2.  **Local Situation Report**: Tracks detailed weather conditions for your city and pulls targeted local news reports.
3.  **Financial & Prediction Markets**: Live tickers for cryptocurrencies (powered by CoinGecko), stock indices, major commodities, and decentralized prediction markets (Polymarket).
4.  **AI Intelligence Briefs**: Utilizing an LLM of your choice (OpenAI, Anthropic, Gemini, etc.), Watchtower digests the current news cycle and local conditions into a concise Situation Report (Sitrep).
5.  **In-App Settings**: Easily configure your geographical coordinates and your preferred AI provider/API key directly from the UI without needing to edit configuration files manually.

## 🛠️ Tech Stack

### Backend
The core intelligence engine runs in **Go (1.22+)**.
*   **REST API**: Exposes straightforward JSON endpoints via the standard `net/http` package.
*   **Data Ingestion**: Utilizes `gofeed` to asynchronously parse global and local RSS syndications.
*   **Configuration**: Leverages `viper` to read, write, and persist user configurations to `~/.config/watchtower/config.yaml`.
*   **LLM Integration**: Native integrations to hit various LLM APIs for the AI brief generation.

### Frontend
The frontend is a single-page application built with **React 19** and **TypeScript**.
*   **Build Tooling**: Bundled incredibly fast with **Vite**.
*   **Styling**: Powered by **Tailwind CSS v4** for a modular, customizable dark-mode aesthetic with modern utility classes.
*   **Icons**: Utilizes **Lucide React** for sharp and scalable SVG iconography.
*   **Data Fetching & State**: Employs **SWR** for data fetching, caching, revalidation, and mutation.
*   **Utility Libraries**: `clsx` and `tailwind-merge` are used to construct robust composite UI components (like the custom `Card` framework).

## 🏁 Getting Started

Running Watchtower requires starting both the backend API server and the frontend development server. 

### Prerequisites
*   [Go](https://go.dev/doc/install) (1.22 or higher)
*   [Node.js](https://nodejs.org/en/) (v18 or higher) and `npm`

### 1. Start the Backend

Open a terminal window and navigate to the project root:
```bash
cd watchtower
go mod tidy
go run main.go
```
The Go server will start on `http://localhost:8080`.

### 2. Start the Frontend

Open a **separate** terminal window and navigate to the `frontend` directory:
```bash
cd watchtower/frontend
npm install
npm run dev
```
The Vite development server will start on `http://localhost:5173`. 
The frontend is pre-configured with a proxy that routes `/api` requests to the Go backend automatically.

### 3. Open the Dashboard

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**. 
Navigate to the **Settings** tab to input your preferred LLM provider, enter your API key, and set your local city. This will persist your settings to the backend, enabling the AI Intel Brief functionality!

## 📁 Project Structure

```text
watchtower/
├── api/             # Go HTTP Handlers and Server definitions
├── config/          # Configurations and Viper file-writing logic
├── feeds/           # RSS Parsing and News aggregration logic
├── intel/           # LLM Prompts and integration logic
├── markets/         # Logic for querying CoinGecko, Polymarket, Yahoo Finance
├── weather/         # Open-Meteo API integrations
├── main.go          # Go entrypoint
│
└── frontend/        # React Application Root
    ├── src/
    │   ├── components/ # Reusable UI pieces (Cards, Layout Shell)
    │   ├── hooks/      # SWR custom hooks connecting to the Go API
    │   ├── lib/        # Tailwind classmerging utility
    │   ├── pages/      # Top-level route components (Overview, Global, Local, Settings)
    │   ├── App.tsx     # App router and state hub
    │   └── index.css   # Global Tailwind directives and CSS variables
    ├── tailwind.config.ts
    ├── vite.config.ts
    └── package.json
```
