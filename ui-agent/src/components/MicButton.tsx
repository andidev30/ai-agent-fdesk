/**
 * MicButton Component
 * Toggle microphone button - click to start/stop recording.
 */

import './MicButton.css';

interface MicButtonProps {
    isConnected: boolean;
    isRecording: boolean;
    onConnect: () => void;
    onToggleRecording: () => void;
}

export function MicButton({
    isConnected,
    isRecording,
    onConnect,
    onToggleRecording,
}: MicButtonProps) {

    const handleClick = () => {
        if (!isConnected) {
            onConnect();
            return;
        }
        onToggleRecording();
    };

    return (
        <button
            className={`mic-button ${isRecording ? 'recording' : ''} ${isConnected ? 'connected' : ''}`}
            onClick={handleClick}
            aria-label={isConnected ? (isRecording ? 'Stop recording' : 'Start recording') : 'Connect'}
        >
            <div className="mic-icon">
                {isRecording ? (
                    // Stop icon (square)
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                ) : (
                    // Mic icon
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                )}
            </div>
            <span className="mic-label">
                {!isConnected ? 'Tap to Connect' : isRecording ? 'Tap to Stop' : 'Tap to Speak'}
            </span>
        </button>
    );
}
