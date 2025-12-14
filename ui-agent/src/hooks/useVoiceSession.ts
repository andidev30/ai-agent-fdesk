/**
 * useVoiceSession Hook
 * Manages the voice session lifecycle with the AI Front Desk Agent.
 * Adapted for ADK event format from run_live().
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createWsClient } from '../lib/wsClient';
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
    customerName?: string;
    phoneNumber?: string;
}

export interface VoiceSessionState {
    isConnected: boolean;
    isRecording: boolean;
    transcripts: TranscriptEntry[];
    queueInfo: QueueInfo | null;
    error: string | null;
}

// ADK Event structure from run_live()
interface ADKEvent {
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

    // Track who spoke last to detect turn changes
    const lastSpeakerRef = useRef<'user' | 'agent' | null>(null);

    // Track current partial transcripts to avoid duplicates
    const currentUserTranscriptRef = useRef<string>('');
    const currentAgentTranscriptRef = useRef<string>('');

    // Generate unique ID for transcript entries
    const generateId = () => Math.random().toString(36).slice(2, 11);

    // Handle incoming ADK events
    const handleADKEvent = useCallback((event: ADKEvent) => {
        // console.log('📨 ADK Event:', JSON.stringify(event).slice(0, 200));

        // Handle input transcription (user speech-to-text)
        if (event.inputTranscription?.text) {
            const newText = event.inputTranscription.text;
            const isFinal = event.inputTranscription.finished ?? false;

            // If last speaker was agent, finalize agent and start new user bubble
            if (lastSpeakerRef.current === 'agent' && currentAgentTranscriptRef.current) {
                // Finalize the agent's transcript
                setState(prev => {
                    const existingIdx = prev.transcripts.findIndex(t => t.type === 'agent' && !t.isFinal);
                    if (existingIdx >= 0) {
                        const updated = [...prev.transcripts];
                        updated[existingIdx] = { ...updated[existingIdx], isFinal: true };
                        return { ...prev, transcripts: updated };
                    }
                    return prev;
                });
                currentAgentTranscriptRef.current = '';
            }
            lastSpeakerRef.current = 'user';

            // Accumulate text for user transcript
            currentUserTranscriptRef.current += newText;
            const fullText = currentUserTranscriptRef.current.trim();

            setState(prev => {
                const existingIdx = prev.transcripts.findIndex(
                    t => t.type === 'user' && !t.isFinal
                );
                const entry: TranscriptEntry = {
                    id: existingIdx >= 0 ? prev.transcripts[existingIdx].id : generateId(),
                    type: 'user',
                    text: fullText,
                    timestamp: new Date(),
                    isFinal: isFinal,
                };

                if (existingIdx >= 0) {
                    const updated = [...prev.transcripts];
                    updated[existingIdx] = entry;
                    return { ...prev, transcripts: updated };
                }
                return { ...prev, transcripts: [...prev.transcripts, entry] };
            });

            // Reset accumulator when final
            if (isFinal) {
                currentUserTranscriptRef.current = '';
            }
        }

        // Handle output transcription (agent speech-to-text)
        if (event.outputTranscription?.text) {
            const newText = event.outputTranscription.text;
            const isFinal = event.outputTranscription.finished ?? false;

            // If last speaker was user, finalize user and start new agent bubble
            if (lastSpeakerRef.current === 'user' && currentUserTranscriptRef.current) {
                // Finalize the user's transcript
                setState(prev => {
                    const existingIdx = prev.transcripts.findIndex(t => t.type === 'user' && !t.isFinal);
                    if (existingIdx >= 0) {
                        const updated = [...prev.transcripts];
                        updated[existingIdx] = { ...updated[existingIdx], isFinal: true };
                        return { ...prev, transcripts: updated };
                    }
                    return prev;
                });
                currentUserTranscriptRef.current = '';
            }
            lastSpeakerRef.current = 'agent';

            // Accumulate text for agent transcript
            currentAgentTranscriptRef.current += newText;
            const fullText = currentAgentTranscriptRef.current.trim();

            setState(prev => {
                const existingIdx = prev.transcripts.findIndex(
                    t => t.type === 'agent' && !t.isFinal
                );
                const entry: TranscriptEntry = {
                    id: existingIdx >= 0 ? prev.transcripts[existingIdx].id : generateId(),
                    type: 'agent',
                    text: fullText,
                    timestamp: new Date(),
                    isFinal: isFinal,
                };

                if (existingIdx >= 0) {
                    const updated = [...prev.transcripts];
                    updated[existingIdx] = entry;
                    return { ...prev, transcripts: updated };
                }
                return { ...prev, transcripts: [...prev.transcripts, entry] };
            });

            // Detect queue number from agent transcript
            // Pattern: A-001, B-014, C-002, etc.
            const queuePattern = /\b([A-D]-\d{2,4})\b/i;
            const queueMatch = fullText.match(queuePattern);
            if (queueMatch) {
                const queueNo = queueMatch[1].toUpperCase();
                // Also try to extract ETA (e.g., "5 menit", "10 minutes")
                const etaPattern = /(\d+)\s*(menit|minutes?)/i;
                const etaMatch = fullText.match(etaPattern);
                const etaMinutes = etaMatch ? parseInt(etaMatch[1]) : 5;

                // Try to extract customer name (e.g., "Bapak Andi", "Ibu Sarah", "Bapak/Ibu John")
                const namePattern = /(?:Bapak|Ibu|Bapak\/Ibu)\s+([A-Za-z]+)/i;
                const nameMatch = fullText.match(namePattern);
                const customerName = nameMatch ? nameMatch[1] : undefined;

                // Try to find phone number from previous user messages
                // Look for patterns like: 08123456789, 0812-345-6789, +62812345678
                let phoneNumber: string | undefined;
                setState(prev => {
                    const userMessages = prev.transcripts.filter(t => t.type === 'user');
                    for (const msg of userMessages) {
                        const phonePattern = /(\+?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{3,4}[-\s]?\d{2,4}|\d{10,13})/;
                        const phoneMatch = msg.text.match(phonePattern);
                        if (phoneMatch) {
                            phoneNumber = phoneMatch[1].replace(/[-\s]/g, '');
                            break;
                        }
                    }
                    return {
                        ...prev,
                        queueInfo: { queueNo, etaMinutes, customerName, phoneNumber },
                        isRecording: false, // Auto stop recording
                    };
                });

                // Auto stop microphone when queue is issued
                if (micCaptureRef.current) {
                    micCaptureRef.current.stop();
                    micCaptureRef.current = null;
                }
            }

            // Reset accumulator when final
            if (isFinal) {
                currentAgentTranscriptRef.current = '';
            }
        }

        // Handle content (audio responses)
        if (event.content?.parts) {
            for (const part of event.content.parts) {
                // Handle inline audio data
                if (part.inlineData?.data) {
                    console.log('🔊 Audio data received, length:', part.inlineData.data.length);
                    if (pcmPlayerRef.current) {
                        try {
                            // Handle URL-safe base64 and add padding if needed
                            let base64 = part.inlineData.data;
                            // Replace URL-safe chars
                            base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
                            // Add padding if needed
                            while (base64.length % 4) {
                                base64 += '=';
                            }

                            const binaryString = atob(base64);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            console.log('🔊 Playing audio, bytes:', bytes.length);
                            pcmPlayerRef.current.play(bytes.buffer);
                        } catch (e) {
                            console.error('Failed to decode audio:', e);
                        }
                    } else {
                        console.warn('⚠️ PCM Player not initialized');
                    }
                }
            }
        }
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsClientRef.current) return;

        const wsUrl = `${WS_URL}/${userIdRef.current}/${sessionIdRef.current}`;
        console.log('🔗 Connecting to:', wsUrl);

        wsClientRef.current = createWsClient(wsUrl, {
            onOpen: () => {
                console.log('✅ WebSocket connected');
                setState(prev => ({ ...prev, isConnected: true, error: null }));
            },
            onClose: () => {
                console.log('❌ WebSocket disconnected');
                setState(prev => ({ ...prev, isConnected: false }));
                wsClientRef.current = null;
            },
            onError: () => {
                setState(prev => ({ ...prev, error: 'Connection failed' }));
            },
            onMessage: handleADKEvent,
        });

        // Initialize audio player
        pcmPlayerRef.current = createPCMPlayer({ sampleRate: 24000 });
    }, [handleADKEvent]);

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
            // Resume audio context (requires user interaction)
            if (pcmPlayerRef.current) {
                await pcmPlayerRef.current.resume();
            }

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
        currentUserTranscriptRef.current = '';
        currentAgentTranscriptRef.current = '';
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
