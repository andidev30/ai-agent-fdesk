# AI Agent

Voice-enabled AI Front Desk Agent using [Google ADK](https://google.github.io/adk-docs/) with Gemini 2.0 Flash Live.

## Architecture

```
┌───────────────┐     WebSocket      ┌──────────────────┐
│    Browser    │◄──────────────────►│  FastAPI Server  │
│  (Audio/Text) │                    │  (main.py)       │
└───────────────┘                    └────────┬─────────┘
                                              │
                                     ┌────────▼─────────┐
                                     │   ADK Runner     │
                                     │   (Gemini Live)  │
                                     └────────┬─────────┘
                                              │
                                     ┌────────▼─────────┐
                                     │  MCP Toolbox     │
                                     │  (Queue Tools)   │
                                     └──────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `agent.py` | ADK agent definition with Gemini Live model |
| `main.py` | FastAPI WebSocket server for bidi-streaming |
| `prompts/system.md` | System prompt for agent behavior |
| `requirements.txt` | Python dependencies |
| `.env.example` | Example environment variables |

## Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GOOGLE_API_KEY
```

## Running

```bash
# Start the server
python main.py

# Or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## WebSocket Protocol

### Client → Server
```json
{ "type": "audio.chunk", "dataB64": "<base64 PCM16 audio>" }
{ "type": "text", "text": "Hello" }
{ "type": "session.stop" }
```

### Server → Client
```json
{ "type": "asr.partial", "text": "..." }
{ "type": "asr.final", "text": "..." }
{ "type": "agent.text", "text": "..." }
{ "type": "agent.audio", "dataB64": "...", "sampleRate": 24000 }
{ "type": "queue.issued", "queueNo": "A-014", "etaMinutes": 12 }
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | ✅ | Google AI API key with Gemini Live access |
| `TOOLBOX_URL` | ❌ | MCP Toolbox URL (default: `http://localhost:5000`) |
| `HOST` | ❌ | Server host (default: `0.0.0.0`) |
| `PORT` | ❌ | Server port (default: `8000`) |
