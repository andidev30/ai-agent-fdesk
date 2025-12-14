/**
 * TranscriptPanel Component
 * Displays the conversation transcript between user and agent.
 */

import type { TranscriptEntry } from '../hooks/useVoiceSession';
import './TranscriptPanel.css';

interface TranscriptPanelProps {
    transcripts: TranscriptEntry[];
}

export function TranscriptPanel({ transcripts }: TranscriptPanelProps) {
    return (
        <div className="transcript-panel">
            <div className="transcript-header">
                <h3>Conversation</h3>
            </div>
            <div className="transcript-messages">
                {transcripts.length === 0 ? (
                    <div className="transcript-empty">
                        <p>Start speaking to begin the conversation</p>
                    </div>
                ) : (
                    transcripts.map((entry) => (
                        <div
                            key={entry.id}
                            className={`transcript-entry ${entry.type} ${entry.isFinal ? 'final' : 'partial'}`}
                        >
                            <div className="transcript-avatar">
                                {entry.type === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="transcript-content">
                                <span className="transcript-label">
                                    {entry.type === 'user' ? 'You' : 'Agent'}
                                </span>
                                <p className="transcript-text">{entry.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
