/**
 * WebSocket Client for AI Front Desk Agent
 * Handles bidirectional audio/text streaming with the backend.
 */

export type MessageType = 
  | 'session.start'
  | 'session.stop'
  | 'audio.chunk'
  | 'text'
  | 'asr.partial'
  | 'asr.final'
  | 'agent.text'
  | 'agent.audio'
  | 'agent.transcript'
  | 'queue.issued';

export interface WSMessage {
  type: MessageType;
  text?: string;
  dataB64?: string;
  format?: string;
  sampleRate?: number;
  queueNo?: string;
  etaMinutes?: number;
}

export interface WSClientOptions {
  onMessage?: (message: WSMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function createWsClient(
  wsUrl: string,
  options: WSClientOptions = {}
): {
  send: (message: WSMessage) => void;
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
      const message: WSMessage = JSON.parse(event.data);
      options.onMessage?.(message);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  return {
    send: (message: WSMessage) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    },

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
