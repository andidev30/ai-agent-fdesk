/**
 * WebSocket Client for AI Front Desk Agent
 * Handles bidirectional audio/text streaming with the backend.
 * Adapted for ADK event format.
 */

// ADK Event types from run_live()
export interface ADKEvent {
  partial?: boolean;
  inputTranscription?: {
    text: string;
    finished?: boolean;
  };
  outputTranscription?: {
    text: string;
    finished?: boolean;
  };
  content?: {
    parts?: Array<{
      text?: string;
      inlineData?: {
        data: string;
        mimeType?: string;
      };
    }>;
  };
  author?: string;
  invocationId?: string;
  actions?: unknown;
}

export interface WSClientOptions {
  onMessage?: (event: ADKEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function createWsClient(
  wsUrl: string,
  options: WSClientOptions = {}
): {
  sendAudio: (audioData: ArrayBuffer) => void;
  sendText: (text: string) => void;
  close: () => void;
  getState: () => number;
} {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('🔗 WebSocket connected');
    options.onOpen?.();
  };

  ws.onclose = () => {
    console.log('🔌 WebSocket disconnected');
    options.onClose?.();
  };

  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
    options.onError?.(error);
  };

  ws.onmessage = (event) => {
    try {
      const adkEvent: ADKEvent = JSON.parse(event.data);
      options.onMessage?.(adkEvent);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  return {
    sendAudio: (audioData: ArrayBuffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        const dataB64 = btoa(
          String.fromCharCode(...new Uint8Array(audioData))
        );
        ws.send(JSON.stringify({
          type: 'audio.chunk',
          dataB64,
        }));
      }
    },

    sendText: (text: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'text', text }));
      }
    },

    close: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'session.stop' }));
      }
      ws.close();
    },

    getState: () => ws.readyState,
  };
}
