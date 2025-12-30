import { format } from 'date-fns';

interface TicketData {
  id: string;
  qrCode: string;
  backupCode: string;
  status: string;
  usedAt?: string;
  scannedBy?: string;
  event: {
    title: string;
    startDate: string;
    venue: string;
  };
  user: {
    firstName?: string;
    lastName?: string;
    phoneNumber: string;
  };
  scanHistory?: Array<{
    scannedAt: string;
    scannedBy: string;
    location?: string;
    result: string;
  }>;
}

interface VerificationResultProps {
  valid: boolean;
  message: string;
  ticket?: TicketData;
  usedAt?: string;
  scanHistory?: Array<{
    scannedAt: string;
    scannedBy: string;
    location?: string;
    result: string;
  }>;
  onClose: () => void;
  onMarkAsUsed?: () => void;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  valid,
  message,
  ticket,
  usedAt,
  scanHistory,
  onClose,
  onMarkAsUsed,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = () => {
    if (valid) return 'bg-green-100 border-green-500 text-green-900';
    return 'bg-red-100 border-red-500 text-red-900';
  };

  const getStatusIcon = () => {
    if (valid) {
      return (
        <svg
          className="w-16 h-16 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-16 h-16 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  };

  return (
    <div className="verification-result-overlay">
      <div className={`verification-result-card ${getStatusColor()}`}>
        {/* Status Icon */}
        <div className="result-icon">{getStatusIcon()}</div>

        {/* Status Message */}
        <h2 className="result-title">{message}</h2>

        {/* Ticket Details (if valid) */}
        {valid && ticket && (
          <div className="ticket-details">
            <div className="detail-section">
              <h3>Attendee Information</h3>
              <p>
                <strong>Name:</strong>{' '}
                {ticket.user.firstName && ticket.user.lastName
                  ? `${ticket.user.firstName} ${ticket.user.lastName}`
                  : 'N/A'}
              </p>
              <p>
                <strong>Phone:</strong> {ticket.user.phoneNumber}
              </p>
            </div>

            <div className="detail-section">
              <h3>Event Information</h3>
              <p>
                <strong>Event:</strong> {ticket.event.title}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(ticket.event.startDate)}
              </p>
              <p>
                <strong>Venue:</strong> {ticket.event.venue}
              </p>
            </div>

            <div className="detail-section">
              <h3>Ticket Information</h3>
              <p>
                <strong>QR Code:</strong> {ticket.qrCode}
              </p>
              <p>
                <strong>Backup Code:</strong> {ticket.backupCode}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className="ticket-status">{ticket.status}</span>
              </p>
            </div>
          </div>
        )}

        {/* Duplicate Scan Warning */}
        {!valid && usedAt && (
          <div className="duplicate-warning">
            <h3>⚠️ Duplicate Scan Detected</h3>
            <p>
              <strong>Previously used at:</strong> {formatDate(usedAt)}
            </p>
          </div>
        )}

        {/* Scan History */}
        {scanHistory && scanHistory.length > 0 && (
          <div className="scan-history">
            <h3>Scan History</h3>
            <div className="history-list">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div key={index} className="history-item">
                  <p>
                    <strong>Time:</strong> {formatDate(scan.scannedAt)}
                  </p>
                  <p>
                    <strong>Scanned by:</strong> {scan.scannedBy}
                  </p>
                  {scan.location && (
                    <p>
                      <strong>Location:</strong> {scan.location}
                    </p>
                  )}
                  <p>
                    <strong>Result:</strong>{' '}
                    <span className={`result-${scan.result}`}>
                      {scan.result}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="result-actions">
          {valid && ticket?.status === 'valid' && onMarkAsUsed && (
            <button onClick={onMarkAsUsed} className="btn-primary">
              Mark as Used
            </button>
          )}
          <button onClick={onClose} className="btn-secondary">
            {valid ? 'Scan Another' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
