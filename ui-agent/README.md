# UI Agent

React-based kiosk interface for the AI Front Desk Agent.

## Tech Stack

- **Vite** - Build tool
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Web Audio API** - Microphone capture & audio playback

## Features

- 🎤 Push-to-talk voice interface
- 📝 Real-time transcription display
- 🎫 Queue number card with ETA
- 🔌 WebSocket connection status indicator

## Project Structure

```
src/
├── App.tsx                    # Main application
├── App.css                    # Global styles
├── hooks/
│   └── useVoiceSession.ts     # Voice session management
├── components/
│   ├── MicButton.tsx          # Microphone button
│   ├── TranscriptPanel.tsx    # Conversation display
│   └── QueueCard.tsx          # Queue number display
└── lib/
    ├── wsClient.ts            # WebSocket client
    ├── micCapture.ts          # Audio capture (PCM16)
    └── pcmPlayer.ts           # Audio playback
```

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

Output in `dist/` folder.

## Environment Variables

Create a `.env` file:

```env
VITE_WS_URL=ws://localhost:8000/ws
```

## Usage

1. Click the microphone button to connect
2. Hold the button and speak
3. Release to send audio
4. View transcription and agent responses
5. Queue card appears when ticket is issued

## Audio Formats

| Direction | Format | Sample Rate |
|-----------|--------|-------------|
| Input (mic) | PCM16 | 16000 Hz |
| Output (agent) | PCM16 | 24000 Hz |
