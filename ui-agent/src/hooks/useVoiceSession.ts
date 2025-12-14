/**
 * useVoiceSession Hook
 * Manages the voice session lifecycle with the AI Front Desk Agent.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createWsClient } from '../lib/wsClient';
import type { WSMessage } from '../lib/wsClient';
import { createMicCapture } from '../lib/micCapture';
import { createPCMPlayer } from '../lib/pcmPlayer';

export interface TranscriptEntry {
    id: string;
    type: 'user' | 'agent';
    text: string;
    timestamp: Date;
    isFinal: boolean;
}

export interface QueueInfo {
    queueNo: string;
    etaMinutes: number;
}

export interface VoiceSessionState {
    isConnected: boolean;
    isRecording: boolean;
    transcripts: TranscriptEntry[];
    queueInfo: QueueInfo | null;
    error: string | null;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export function useVoiceSession() {
    const [state, setState] = useState<VoiceSessionState>({
        isConnected: false,
        isRecording: false,
        transcripts: [],
        queueInfo: null,
        error: null,
    });

    const wsClientRef = useRef<ReturnType<typeof createWsClient> | null>(null);
    const micCaptureRef = useRef<ReturnType<typeof createMicCapture> | null>(null);
    const pcmPlayerRef = useRef<ReturnType<typeof createPCMPlayer> | null>(null);
    const sessionIdRef = useRef<string>(`session-${Date.now()}`);
    const userIdRef = useRef<string>(`user-${Math.random().toString(36).slice(2, 9)}`);

    // Generate unique ID for transcript entries
    const generateId = () => Math.random().toString(36).slice(2, 11);

    // Handle incoming WebSocket messages
    const handleMessage = useCallback((message: WSMessage) => {
        switch (message.type) {
            case 'asr.partial':
            case 'asr.final':
                setState(prev => {
                    // Update or add user transcript
                    const existingIdx = prev.transcripts.findIndex(
                        t => t.type === 'user' && !t.isFinal
                    );
                    const entry: TranscriptEntry = {
                        id: existingIdx >= 0 ? prev.transcripts[existingIdx].id : generateId(),
                        type: 'user',
                        text: message.text || '',
                        timestamp: new Date(),
                        isFinal: message.type === 'asr.final',
                    };

                    if (existingIdx >= 0) {
                        const updated = [...prev.transcripts];
                        updated[existingIdx] = entry;
                        return { ...prev, transcripts: updated };
                    }
                    return { ...prev, transcripts: [...prev.transcripts, entry] };
                });
                break;

            case 'agent.text':
            case 'agent.transcript':
                setState(prev => ({
                    ...prev,
                    transcripts: [
                        ...prev.transcripts,
                        {
                            id: generateId(),
                            type: 'agent',
                            text: message.text || '',
                            timestamp: new Date(),
                            isFinal: true,
                        },
                    ],
                }));
                break;

            case 'agent.audio':
                if (message.dataB64 && pcmPlayerRef.current) {
                    const binaryString = atob(message.dataB64);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    pcmPlayerRef.current.play(bytes.buffer);
                }
                break;

            case 'queue.issued':
                setState(prev => ({
                    ...prev,
                    queueInfo: {
                        queueNo: message.queueNo || '',
                        etaMinutes: message.etaMinutes || 0,
                    },
                }));
                break;
        }
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsClientRef.current) return;

        const wsUrl = `${WS_URL}/${userIdRef.current}/${sessionIdRef.current}`;

        wsClientRef.current = createWsClient(wsUrl, {
            onOpen: () => {
                setState(prev => ({ ...prev, isConnected: true, error: null }));
            },
            onClose: () => {
                setState(prev => ({ ...prev, isConnected: false }));
                wsClientRef.current = null;
            },
            onError: () => {
                setState(prev => ({ ...prev, error: 'Connection failed' }));
            },
            onMessage: handleMessage,
        });

        // Initialize audio player
        pcmPlayerRef.current = createPCMPlayer({ sampleRate: 24000 });
    }, [handleMessage]);

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (micCaptureRef.current) {
            micCaptureRef.current.stop();
            micCaptureRef.current = null;
        }
        if (wsClientRef.current) {
            wsClientRef.current.close();
            wsClientRef.current = null;
        }
        if (pcmPlayerRef.current) {
            pcmPlayerRef.current.stop();
            pcmPlayerRef.current = null;
        }
        setState(prev => ({ ...prev, isConnected: false, isRecording: false }));
    }, []);

    // Start recording
    const startRecording = useCallback(async () => {
        if (!wsClientRef.current || state.isRecording) return;

        try {
            micCaptureRef.current = createMicCapture({
                sampleRate: 16000,
                onAudioData: (data) => {
                    wsClientRef.current?.sendAudio(data);
                },
            });
            await micCaptureRef.current.start();
            setState(prev => ({ ...prev, isRecording: true }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: 'Microphone access denied'
            }));
        }
    }, [state.isRecording]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (micCaptureRef.current) {
            micCaptureRef.current.stop();
            micCaptureRef.current = null;
        }
        setState(prev => ({ ...prev, isRecording: false }));
    }, []);

    // Toggle recording (start/stop)
    const toggleRecording = useCallback(async () => {
        if (state.isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }, [state.isRecording, startRecording, stopRecording]);

    // Send text message
    const sendText = useCallback((text: string) => {
        if (!wsClientRef.current) return;
        wsClientRef.current.sendText(text);
        setState(prev => ({
            ...prev,
            transcripts: [
                ...prev.transcripts,
                {
                    id: generateId(),
                    type: 'user',
                    text,
                    timestamp: new Date(),
                    isFinal: true,
                },
            ],
        }));
    }, []);

    // Clear transcripts
    const clearTranscripts = useCallback(() => {
        setState(prev => ({ ...prev, transcripts: [], queueInfo: null }));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        startRecording,
        stopRecording,
        toggleRecording,
        sendText,
        clearTranscripts,
    };
}
