import { useState, useEffect } from 'react';
import { authenticatedFetch } from '../../utils/auth';

interface SplitPaymentLinksProps {
  purchaseData: any;
  onClose: () => void;
}

export function SplitPaymentLinks({ purchaseData, onClose }: SplitPaymentLinksProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<any>(null);

  const { bulk_purchase, split_links } = purchaseData;

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/api/tickets/bulk-purchase/${bulk_purchase.id}/status`
      );
      
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const copyToClipboard = (link: string, index: number) => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shareViaWhatsApp = (link: string, shareNumber: number) => {
    const message = encodeURIComponent(
      `🎫 You're invited to join a group ticket purchase!\n\n` +
      `Event: ${bulk_purchase.event_title}\n` +
      `Your share: ₦${split_links[shareNumber - 1].amount.toLocaleString()}\n\n` +
      `Pay here: ${link}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const progress = status ? (status.paid_count / status.total_tickets) * 100 : 0;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>🎫 Split Payment Links</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div style={styles.eventInfo}>
          <h3 style={styles.eventTitle}>{bulk_purchase.event_title}</h3>
          <p style={styles.eventDetail}>
            {bulk_purchase.quantity} tickets • ₦{bulk_purchase.final_amount.toLocaleString()} total
          </p>
          {bulk_purchase.discount_percentage > 0 && (
            <p style={styles.discount}>
              🎉 {bulk_purchase.discount_percentage}% bulk discount applied!
            </p>
          )}
        </div>

        {status && (
          <div style={styles.progressSection}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>Payment Progress</span>
              <span style={styles.progressCount}>
                {status.paid_count} / {status.total_tickets} paid
              </span>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div style={styles.linksSection}>
          <h3 style={styles.sectionTitle}>Share these links with your group:</h3>
          <div style={styles.linksList}>
            {split_links.map((linkData: any, index: number) => {
              const shareStatus = status?.share_statuses?.[index];
              const isPaid = shareStatus?.status === 'paid';
              
              return (
                <div key={index} style={styles.linkCard}>
                  <div style={styles.linkHeader}>
                    <span style={styles.linkNumber}>Ticket #{linkData.share_number}</span>
                    <span style={isPaid ? styles.statusPaid : styles.statusPending}>
                      {isPaid ? '✓ Paid' : 'Pending'}
                    </span>
                  </div>
                  
                  <div style={styles.linkAmount}>
                    ₦{linkData.amount.toLocaleString()}
                  </div>
                  
                  {isPaid && shareStatus.paid_by && (
                    <div style={styles.paidBy}>
                      Paid by: {shareStatus.paid_by}
                    </div>
                  )}
                  
                  {!isPaid && (
                    <>
                      <div style={styles.linkUrl}>
                        <input
                          type="text"
                          value={linkData.link}
                          readOnly
                          style={styles.linkInput}
                        />
                        <button
                          onClick={() => copyToClipboard(linkData.link, index)}
                          style={styles.copyButton}
                        >
                          {copiedIndex === index ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      
                      <div style={styles.shareButtons}>
                        <button
                          onClick={() => shareViaWhatsApp(linkData.link, linkData.share_number)}
                          style={styles.whatsappButton}
                        >
                          <span>💬 Share on WhatsApp</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            💡 Tip: Share these links with your group. Once everyone pays, tickets will be issued automatically.
          </p>
          <button onClick={onClose} style={styles.doneButton}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '700px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
  },
  eventInfo: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  eventTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  eventDetail: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0',
  },
  discount: {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '500',
    margin: '4px 0 0 0',
  },
  progressSection: {
    marginBottom: '24px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  progressCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    transition: 'width 0.3s ease',
  },
  linksSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  linksList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  linkCard: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  linkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  linkNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  statusPaid: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  statusPending: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  linkAmount: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
  },
  paidBy: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
  },
  linkUrl: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  linkInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  shareButtons: {
    display: 'flex',
    gap: '8px',
  },
  whatsappButton: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#25D366',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  doneButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
