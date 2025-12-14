# AI Front Desk Agent

Voice-first AI agent for customer triage and queue management, built with Google ADK Streaming and Gemini 2.0 Flash Live.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (or use SQLite for local testing)
- Google API Key with Gemini Live API access

### 1. Database Setup
```bash
# Create PostgreSQL database and run schema
psql -U postgres -c "CREATE DATABASE frontdesk;"
psql -U postgres -d frontdesk -f sql/schema/001_init.sql
```

### 2. Start MCP Toolbox
```bash
cd mcp-toolbox
export DB_HOST=localhost DB_NAME=frontdesk DB_USER=postgres DB_PASSWORD=your-password
npx @toolbox-sdk/server --tools-file tools.yaml
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

Open http://localhost:5173 and click the microphone button to start!

## Project Structure

```
├── sql/schema/         # PostgreSQL schema
├── mcp-toolbox/        # MCP Toolbox configuration (queue tools)
├── ai-agent/           # ADK Streaming server (Python/FastAPI)
└── ui-agent/           # React frontend (Vite/TypeScript)
```

## Features

- 🎤 **Voice-first interaction** using Gemini 2.0 Flash Live
- 🎫 **Queue management** with automated ticket issuance
- 🌐 **Bilingual support** (Indonesian/English)
- ⚡ **Real-time transcription** for both user and agent speech
- 🔧 **MCP Toolbox** for secure database operations

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────────┐     MCP      ┌──────────────┐
│   Browser   │◄──────────────────►│  FastAPI + ADK  │◄────────────►│   Toolbox    │
│   (React)   │    Audio/Text      │  (Gemini Live)  │              │  (Postgres)  │
└─────────────┘                    └─────────────────┘              └──────────────┘
```
