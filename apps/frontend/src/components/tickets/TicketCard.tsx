import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface TicketCardProps {
  ticket: {
    id: string;
    ticket_code: string;
    qr_code?: string;
    ticket_type: string;
    price: number;
    status: string;
    purchased_at: string;
    event?: {
      title: string;
      event_date: string;
      venue_name: string;
      banner_image_url?: string;
    };
  };
  onDownload?: () => void;
}

export function TicketCard({ ticket, onDownload }: TicketCardProps) {
  const [showQR, setShowQR] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'used':
        return '#6b7280';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Valid';
      case 'used':
        return 'Used';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div style={styles.card}>
      {/* Event Banner */}
      {ticket.event?.banner_image_url && (
        <div style={styles.banner}>
          <img 
            src={ticket.event.banner_image_url} 
            alt={ticket.event.title}
            style={styles.bannerImage}
          />
        </div>
      )}

      {/* Ticket Content */}
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.eventTitle}>{ticket.event?.title || 'Event'}</h3>
            <p style={styles.ticketType}>{ticket.ticket_type}</p>
          </div>
          <div 
            style={{
              ...styles.statusBadge,
              backgroundColor: getStatusColor(ticket.status) + '20',
              color: getStatusColor(ticket.status)
            }}
          >
            {getStatusLabel(ticket.status)}
          </div>
        </div>

        {/* Ticket Code */}
        <div style={styles.ticketCodeSection}>
          <p style={styles.ticketCodeLabel}>TICKET CODE</p>
          <div style={styles.ticketCodeBox}>
            <span style={styles.ticketCode}>{ticket.ticket_code}</span>
            <button
              onClick={() => navigator.clipboard.writeText(ticket.ticket_code)}
              style={styles.copyButton}
              title="Copy ticket code"
            >
              📋
            </button>
          </div>
        </div>

        {/* Event Details */}
        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>📅 Date:</span>
            <span style={styles.detailValue}>
              {ticket.event?.event_date ? formatDate(ticket.event.event_date) : 'TBD'}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>📍 Venue:</span>
            <span style={styles.detailValue}>{ticket.event?.venue_name || 'TBD'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>💰 Price:</span>
            <span style={styles.detailValue}>₦{ticket.price.toLocaleString()}</span>
          </div>
        </div>

        {/* QR Code Section */}
        <div style={styles.qrSection}>
          <button
            onClick={() => setShowQR(!showQR)}
            style={styles.qrToggleButton}
          >
            {showQR ? '🔼 Hide QR Code' : '🔽 Show QR Code'}
          </button>

          {showQR && (
            <div style={styles.qrContainer}>
              <div style={styles.qrBox}>
                {ticket.qr_code ? (
                  <img 
                    src={`data:image/png;base64,${ticket.qr_code}`}
                    alt="Ticket QR Code"
                    style={styles.qrImage}
                  />
                ) : (
                  <QRCodeSVG 
                    value={ticket.ticket_code}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                )}
              </div>
              <p style={styles.qrInstructions}>
                📱 Show this QR code at the event entrance
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            onClick={onDownload}
            style={styles.downloadButton}
            disabled={ticket.status !== 'active'}
          >
            ⬇️ Download Ticket
          </button>
          <button
            onClick={() => window.print()}
            style={styles.printButton}
            disabled={ticket.status !== 'active'}
          >
            🖨️ Print Ticket
          </button>
        </div>

        {/* Purchase Info */}
        <p style={styles.purchaseInfo}>
          Purchased on {new Date(ticket.purchased_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: '20px',
  } as React.CSSProperties,
  banner: {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  } as React.CSSProperties,
  bannerImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  } as React.CSSProperties,
  content: {
    padding: '24px',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  } as React.CSSProperties,
  eventTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  } as React.CSSProperties,
  ticketType: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  } as React.CSSProperties,
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  ticketCodeSection: {
    marginBottom: '20px',
  } as React.CSSProperties,
  ticketCodeLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  ticketCodeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    border: '2px dashed #d1d5db',
  } as React.CSSProperties,
  ticketCode: {
    flex: 1,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    fontFamily: 'monospace',
    letterSpacing: '2px',
  } as React.CSSProperties,
  copyButton: {
    padding: '8px 12px',
    fontSize: '18px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  details: {
    marginBottom: '20px',
  } as React.CSSProperties,
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
  } as React.CSSProperties,
  detailValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'right' as const,
  } as React.CSSProperties,
  qrSection: {
    marginBottom: '20px',
  } as React.CSSProperties,
  qrToggleButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  qrContainer: {
    marginTop: '16px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  qrBox: {
    display: 'inline-block',
    padding: '20px',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    marginBottom: '12px',
  } as React.CSSProperties,
  qrImage: {
    width: '200px',
    height: '200px',
  } as React.CSSProperties,
  qrInstructions: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,
  downloadButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  printButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  purchaseInfo: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    margin: 0,
  } as React.CSSProperties,
};
