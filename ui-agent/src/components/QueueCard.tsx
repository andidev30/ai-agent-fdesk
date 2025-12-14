/**
 * QueueCard Component
 * Displays the issued queue number and ETA.
 */

import type { QueueInfo } from '../hooks/useVoiceSession';
import './QueueCard.css';

interface QueueCardProps {
    queueInfo: QueueInfo | null;
}

export function QueueCard({ queueInfo }: QueueCardProps) {
    if (!queueInfo) return null;

    return (
        <div className="queue-card">
            <div className="queue-card-header">
                <span className="queue-icon">🎫</span>
                <span>Your Queue Number</span>
            </div>
            <div className="queue-number">{queueInfo.queueNo}</div>
            <div className="queue-eta">
                <span className="eta-label">Estimated wait:</span>
                <span className="eta-value">
                    {queueInfo.etaMinutes <= 0
                        ? 'You are next!'
                        : `~${queueInfo.etaMinutes} minutes`
                    }
                </span>
            </div>
            <div className="queue-hint">
                Please wait for your number to be called
            </div>
        </div>
    );
}
