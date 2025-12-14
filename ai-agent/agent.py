"""
AI Front Desk Agent - Agent Definition

This module defines the ADK agent for the front desk voice assistant.
Uses Gemini 2.5 Flash Live for native audio streaming.
"""

from pathlib import Path
from google.adk.agents import Agent
from toolbox_core import ToolboxSyncClient

# Load system prompt from file
PROMPT_PATH = Path(__file__).parent / "prompts" / "system.md"
SYSTEM_INSTRUCTION = PROMPT_PATH.read_text() if PROMPT_PATH.exists() else ""

# MCP Toolbox server URL (set via environment variable or default)
import os
TOOLBOX_URL = os.getenv("TOOLBOX_URL", "http://localhost:5001")

def load_tools():
    """Load tools from MCP Toolbox server."""
    try:
        client = ToolboxSyncClient(TOOLBOX_URL)
        tools = client.load_toolset("frontdesk")
        return tools
    except Exception as e:
        print(f"Warning: Could not load tools from toolbox: {e}")
        return []

# Create the front desk agent
root_agent = Agent(
    name="frontdesk_agent",
    # From ADK sample: gemini-2.5-flash-native-audio-preview-09-2025
    model="gemini-2.5-flash-native-audio-preview-09-2025",
    description="AI-powered front desk agent that greets customers, performs triage, and issues queue tickets.",
    instruction=SYSTEM_INSTRUCTION,
    tools=load_tools(),
)
