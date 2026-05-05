# Watchtower Frontend Interface

This directory contains the user interface for Watchtower, built with **React**, **TypeScript**, and **Vite**.

## Tech Stack

*   **React 19**: Modern UI component library.
*   **Vite**: Extremely fast bundler and dev server.
*   **Tailwind CSS v4**: Utility-first CSS framework enforcing a dark-mode theme across the dashboard.
*   **SWR**: Client-side data fetching library configured to interface with the Go backend API.
*   **Lucide React**: Open-source crisp SVG iconography.

## Getting Started

Before doing anything in this repository, ensure the Go backend API is running concurrently (which powers all the data shown in this frontend).

```bash
# Install NPM dependencies
npm install

# Start the Vite development environment
npm run dev
```

The application will be available at `http://localhost:5173`.

### Vite Proxy

You do not need to configure CORS for local development. `vite.config.ts` is configured with an internal proxy. Any API requests shipped to `/api/*` are perfectly routed to your locally-running Go backend server at `http://localhost:8080`. 

## Project Structure

- `src/components/Layout.tsx` contains the layout skeleton, persistent routing sidebar, and structural grid.
- `src/components/ui/` contains reusable composite Tailwind shells (like `Card.tsx`).
- `src/pages/` orchestrates the distinct dashboards (Overview, Global, Local, and Settings).
- `src/hooks/useApi.ts` houses abstract SWR and Fetch functions interfacing with the Go server.
