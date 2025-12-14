/**
 * QueueCard Component
 * Displays the issued queue ticket with number, name, phone, and ETA.
 */

import './QueueCard.css';

interface QueueCardProps {
    queueNo: string;
    etaMinutes: number;
    customerName?: string;
    phoneNumber?: string;
}

export function QueueCard({ queueNo, etaMinutes, customerName, phoneNumber }: QueueCardProps) {
    return (
        <div className="queue-card">
            <div className="queue-card-header">
                <span className="queue-icon">🎫</span>
                <div>
                    <h3>Nomor Antrian Anda</h3>
                    <p className="queue-photo-hint">📸 Silakan foto untuk bukti</p>
                </div>
            </div>

            {(customerName || phoneNumber) && (
                <div className="queue-customer-info">
                    {customerName && (
                        <div className="info-row">
                            <span className="info-label">Nama</span>
                            <span className="info-value">{customerName}</span>
                        </div>
                    )}
                    {phoneNumber && (
                        <div className="info-row">
                            <span className="info-label">No. HP</span>
                            <span className="info-value">{phoneNumber}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="queue-number-display">
                <span className="queue-number">{queueNo}</span>
            </div>

            <div className="queue-eta">
                <span className="eta-label">Perkiraan waktu tunggu</span>
                <span className="eta-value">
                    {etaMinutes <= 0
                        ? 'Anda berikutnya!'
                        : `~${etaMinutes} menit`
                    }
                </span>
            </div>

            <div className="queue-footer">
                <p>Silakan menunggu di ruang tunggu</p>
            </div>
        </div>
    );
}
