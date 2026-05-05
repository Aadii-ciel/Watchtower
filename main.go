package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"watchtower/api"
	"watchtower/config"
)

var (
	version = "dev"
	commit  = "none"
	date    = "unknown"
)

func main() {
	// handle --version / -v
	if len(os.Args) > 1 && (os.Args[1] == "--version" || os.Args[1] == "-v") {
		fmt.Printf("watchtower %s (commit: %s, built: %s)\n", version, commit, date)
		os.Exit(0)
	}

	if !config.ConfigExists() {
		log.Println("Config not found. Please create ~/.config/watchtower/config.yaml")
		// Fallback to basic load which might error or give defaults, but let's try to load anyway
		// For a web app, maybe we shouldn't exit, but just run with defaults.
	}

	cfg, err := config.Load()
	if err != nil {
		log.Printf("Warning: error loading config: %v. Using defaults.", err)
		cfg = &config.Config{
			RefreshSec: 120,
			CryptoPairs: []string{"bitcoin", "ethereum", "dogecoin", "usd-coin"},
			BriefCacheMins: 60,
			Location: config.Location{
				City: "Delhi",
				Country: "India",
				Latitude: 28.6139,
				Longitude: 77.2090,
			},
		}
	}

	server := api.NewServer(cfg)

	port := "8080"
	log.Printf("Starting Watchtower API server on :%s...\n", port)
	if err := http.ListenAndServe(":"+port, server); err != nil {
		log.Fatalf("Error starting server: %v\n", err)
	}
}
