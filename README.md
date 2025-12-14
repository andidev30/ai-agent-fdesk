# ADK Bidi Streaming Exploration

An exploration project demonstrating **Google ADK (Agent Development Kit)** with **bidirectional audio streaming** using Gemini 2.0 Flash Live API.

## 🎯 What is this?

This project showcases real-time voice AI interaction using:
- **Google ADK** - Agent Development Kit for building AI agents
- **Gemini Live API** - Native audio streaming with bi-directional communication
- **MCP Toolbox** - Model Context Protocol for secure tool execution

The demo implements a **Front Desk Agent** that can:
- 🎤 Listen and respond in real-time voice
- 🌐 Auto-detect and respond in user's language
- 🎫 Issue queue tickets with customer info
- 📱 Display visual queue cards

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────────────┐     MCP Toolbox    ┌──────────────┐
│   Browser UI    │◄──────────────────►│  FastAPI + ADK Runner   │◄──────────────────►│   Postgres   │
│   (React/TS)    │  PCM Audio/Events  │  (run_live streaming)   │   (tool calls)     │   Database   │
└─────────────────┘                    └─────────────────────────┘                    └──────────────┘
                                                  │
                                                  │ Gemini Live API
                                                  ▼
                                       ┌─────────────────────────┐
                                       │ gemini-2.5-flash-native │
                                       │   -audio-preview        │
                                       └─────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (optional - tools work without DB)
- Google API Key with Gemini API access

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/adk-bidi-streaming.git
cd adk-bidi-streaming
```

### 2. Start MCP Toolbox

```bash
cd mcp-toolbox
cp .env.example .env
# Edit .env with your database credentials
./start.sh
```

### 3. Start AI Agent Server

```bash
cd ai-agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your GOOGLE_API_KEY
python main.py
```

### 4. Start Frontend

```bash
cd ui-agent
npm install
npm run dev
```

Open http://localhost:5173 and click the microphone to start!

## 📁 Project Structure

```
├── sql/schema/         # PostgreSQL schema for queue system
├── mcp-toolbox/        # MCP Toolbox configuration (queue tools)
├── ai-agent/           # ADK Streaming server (Python/FastAPI)
│   ├── main.py         # WebSocket endpoint with run_live()
│   ├── agent.py        # Agent definition with Gemini model
│   └── prompts/        # System prompts
└── ui-agent/           # React frontend (Vite/TypeScript)
    ├── src/lib/        # Audio capture, PCM player, WebSocket
    └── src/hooks/      # Voice session management
```

## 🔑 Key Concepts

### ADK Bidi Streaming

```python
# Using ADK's run_live() for bidirectional streaming
async for event in runner.run_live(
    live_request_queue=live_request_queue,
    session=session,
    run_config=RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=["AUDIO"],
    )
):
    # Process events: transcriptions, audio, tool calls
    await websocket.send_text(event.model_dump_json())
```

### Audio Flow

1. **Mic Capture** → PCM16 @ 16kHz → Base64 → WebSocket
2. **Backend** → ADK `send_realtime()` → Gemini Live API
3. **Response** → ADK events → WebSocket → PCM Player @ 24kHz

### Event Types from ADK

- `inputTranscription` - User speech-to-text
- `outputTranscription` - Agent speech-to-text  
- `content.parts[].inlineData` - Audio response (base64 PCM)
- `actions` - Tool calls and responses

## 📚 Resources

- [Google ADK Documentation](https://developers.google.com/adk)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live)
- [MCP Toolbox](https://github.com/anthropics/anthropic-tools)

## 📝 License

MIT
