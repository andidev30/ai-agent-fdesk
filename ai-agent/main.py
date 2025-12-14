"""
AI Front Desk Agent - FastAPI Server

WebSocket-based server for bidirectional audio streaming using ADK.
Handles real-time voice conversations with the front desk agent.
"""

import asyncio
import base64
import json
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from google.adk.runners import Runner
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agent import root_agent

# Load environment variables
load_dotenv()

# =============================================
# Application Configuration
# =============================================
APP_NAME = "frontdesk-agent"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# =============================================
# Session and Runner Setup
# =============================================
session_service = InMemorySessionService()

runner = Runner(
    app_name=APP_NAME,
    agent=root_agent,
    session_service=session_service,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print(f"🚀 Front Desk Agent server starting on {HOST}:{PORT}")
    print(f"📡 WebSocket endpoint: ws://{HOST}:{PORT}/ws/{{user_id}}/{{session_id}}")
    yield
    print("👋 Server shutting down")


app = FastAPI(
    title="AI Front Desk Agent",
    description="Voice-first AI agent for customer triage and queue management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================
# Health Check Endpoint
# =============================================
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers."""
    return {"status": "healthy", "service": APP_NAME}


# =============================================
# WebSocket Endpoint for Bidi-Streaming
# =============================================
@app.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    user_id: str, 
    session_id: str
) -> None:
    """
    WebSocket endpoint for bidirectional audio/text streaming.
    
    Protocol:
    - Client sends: { "type": "audio.chunk", "dataB64": "..." } or { "type": "text", "text": "..." }
    - Server sends: { "type": "agent.audio", "dataB64": "..." } or { "type": "agent.text", "text": "..." }
    """
    await websocket.accept()
    print(f"📱 Client connected: user={user_id}, session={session_id}")

    # ========================================
    # Session Initialization
    # ========================================
    
    # Configure for audio input/output with transcription
    # Native audio models require AUDIO response modality
    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=["AUDIO"],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        session_resumption=types.SessionResumptionConfig(),
    )

    # Get or create session
    session = await session_service.get_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id,
    )
    if not session:
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )

    # Create the live request queue
    live_request_queue = LiveRequestQueue()

    # ========================================
    # Bidirectional Communication Tasks
    # ========================================

    async def upstream_task() -> None:
        """Receives messages from WebSocket and forwards to agent."""
        try:
            while True:
                raw_message = await websocket.receive_text()
                message = json.loads(raw_message)
                msg_type = message.get("type", "")

                if msg_type == "audio.chunk":
                    # Audio data (base64 encoded PCM16)
                    audio_data = base64.b64decode(message.get("dataB64", ""))
                    print(f"🎤 Audio chunk received: {len(audio_data)} bytes")
                    audio_blob = types.Blob(
                        mime_type="audio/pcm;rate=16000",
                        data=audio_data
                    )
                    live_request_queue.send_realtime(audio_blob)
                
                elif msg_type == "text":
                    # Text message
                    text = message.get("text", "")
                    print(f"💬 Text received: {text}")
                    if text:
                        content = types.Content(parts=[types.Part(text=text)])
                        live_request_queue.send_content(content)
                
                elif msg_type == "session.stop":
                    # Client requested session end
                    print("🛑 Session stop requested")
                    break

        except WebSocketDisconnect:
            print(f"📴 Client disconnected: user={user_id}")
        except Exception as e:
            print(f"❌ Upstream error: {e}")

    async def downstream_task() -> None:
        """Receives events from agent and forwards to WebSocket."""
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                # Debug: print event summary
                event_json = event.model_dump_json(exclude_none=True, by_alias=True)
                print(f"📤 Event to client: {event_json[:200]}...")
                await websocket.send_text(event_json)

        except Exception as e:
            print(f"❌ Downstream error: {e}")

    # ========================================
    # Run Both Tasks Concurrently
    # ========================================
    try:
        await asyncio.gather(
            upstream_task(),
            downstream_task(),
            return_exceptions=True,
        )
    finally:
        live_request_queue.close()
        print(f"🔚 Session ended: user={user_id}, session={session_id}")


# =============================================
# Run Server
# =============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
