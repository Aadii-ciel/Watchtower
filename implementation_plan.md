# Watchtower Enhancement Plan

Based on your feedback, here is a comprehensive plan to address all your points. 

## 1. LLM Speed (Gemini 2.5 Flash is slow)
**Issue:** Gemini's API can be slow or rate-limited for heavy generation tasks.
**Plan:** 
- Switch the primary brief generation engine to **Groq**. Groq runs Llama 3 models on specialized hardware (LPUs) and generates text at an astonishing speed (up to 800+ tokens per second). 
- We already have the Groq provider built into the Go backend, we just need to set it as the default or allow you to easily add a Groq API key to the config.

## 2 & 3. UI / UX (Minimalistic, Fun, Interactive)
**Issue:** The dashboard feels too "sophisticated" and static.
**Plan:**
- **Minimalism:** Remove heavy borders and boxes. Move towards a clean, "bento-box" style layout with ample white space, soft shadows, and clean typography.
- **Interactivity:** Integrate `framer-motion` (a React animation library). We will add spring-based micro-animations so cards react when you hover, and panels smoothly slide/fade into place when data loads. It will feel much more alive and satisfying to click around.

## 4. Live TV YouTube Channels
**Issue:** Specific YouTube Live URLs frequently break because channels rotate their stream IDs.
**Plan:**
- Change the `LiveTV.tsx` implementation from hardcoded video IDs to **Channel IDs**. YouTube allows embedding a channel's *active* live stream using `https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID`. This ensures the stream always works as long as the channel is broadcasting.

## 5. Indian Channels & Blogs
**Issue:** Lack of Indian regional coverage.
**Plan:**
- Update `feeds/feeds.go` to include a curated list of popular Indian RSS feeds (e.g., NDTV, Times of India, The Hindu, Republic TV).
- Update the `data/funding.json` file to include the funding and bias data for these new Indian sources so the "Sponsor Truth" feature still works for them.

## 6. Report Generation Reliability
**Issue:** Reports fail to generate about 50% of the time.
**Plan:**
- This is primarily caused by `HTTP 429 Too Many Requests` (Rate Limits) from the free-tier LLM APIs.
- We will implement a **Retry Mechanism with Exponential Backoff** in `intel/intel.go`. If the LLM throws a 429 error, the server will wait 2 seconds, then try again automatically instead of crashing and returning nothing to the frontend.

## 7. Integrating Agents
**Issue:** Wanting to use, create, and interact with agents.
**Plan:**
- **The "Analyst" Tab:** We will build a brand new interactive UI tab called "Agents". 
- **Tool-Calling Architecture:** In the Go backend, we will implement an Agent Loop. Instead of just "summarizing", we will give the LLM access to "Tools" (e.g., `FetchNews(region)`, `CheckFunding(source)`, `GetWeather(city)`). 
- **Interaction:** You will be able to chat with this Agent. If you ask "What is the bias of the news sources talking about the Indian election?", the Agent will autonomously use the news tool to fetch articles, use the funding tool to check their bias, and then write you a custom report.

## Phase 3: Agentic Architecture (The Final Step)

Now that we have a local `llama3.1:8b` running, we can build a true autonomous agent.

### Goal
Create an interactive "Agents" tab where you can chat with an AI Analyst. The Analyst will not just generate text; it will have access to system **Tools** (fetching news, getting weather, checking sponsor bias) to autonomously research topics before replying.

### Backend Changes (`api/server.go` & `intel/agent.go`)
- **[NEW] `intel/agent.go`**: We will build an Ollama Tool Calling loop. 
- The agent will be given a system prompt defining it as a Watchtower Analyst.
- We will define JSON schemas for our tools: `search_global_news`, `get_local_weather(city)`, `check_source_bias(source)`.
- When you send a message, the Go backend will check if Ollama wants to call a tool, execute the Go function, and return the result back to Ollama until it formulates a final answer.
- **`api/server.go`**: Add websocket or streaming endpoints so the UI can show what the agent is doing in real-time (e.g., *[Agent is searching global feeds...]*).

### Frontend Changes (`frontend/src/pages/Agents.tsx`)
- **[NEW] `Agents.tsx`**: A chat-like interface. 
- A sidebar to select the "Persona" (e.g., Geopolitical Analyst, Cyber Security Expert).
- A main chat window to converse with the agent and see the tools it executes.
- Add the "Agents" tab to the main navigation sidebar in `Layout.tsx`.

## Open Questions
> [!IMPORTANT]
> Please review the Agent Architecture plan above. 
> 1. Do you want the Agent to only have access to Watchtower's current data (RSS feeds, Weather, Funding bias), or should I also give it a tool to do live Web Searches?
> 2. Are you ready for me to start writing the Agent code?
