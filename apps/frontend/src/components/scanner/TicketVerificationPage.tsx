import { useState, useEffect } from 'react';
import { TicketScanner } from './TicketScanner';
import { VerificationResult } from './VerificationResult';
import { BackupCodeInput } from './BackupCodeInput';
import { offlineScanQueue } from '../../services/offlineScanQueue';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

interface VerificationResponse {
  valid: boolean;
  message: string;
  ticket?: any;
  usedAt?: string;
  scanHistory?: any[];
}

export const TicketVerificationPage: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [verificationResult, setVerificationResult] =
    useState<VerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScans, setPendingScans] = useState(0);

  // Get scanner user info from auth
  const scannerId = user?.id || 'anonymous-scanner';
  const scannerName = user ? `${user.firstName} ${user.lastName}` : 'Event Scanner';

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update pending count on mount
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = () => {
    setPendingScans(offlineScanQueue.getPendingCount());
  };

  const handleScanSuccess = async (qrCode: string) => {
    setIsVerifying(true);
    setError(null);

// Remove unused _scanId variables entirely since they're not needed
    // If offline, queue the scan
    if (!navigator.onLine) {
      offlineScanQueue.queueScan({
        qrCode,
        scannedBy: scannerId,
        location: 'Event Entrance',
        deviceInfo: navigator.userAgent,
      });

      setError('You are offline. Scan has been queued and will be processed when connection is restored.');
      updatePendingCount();
      setIsVerifying(false);
      return;
    }

    try {
      // Verify ticket using Supabase
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      // First, find the ticket by QR code
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            date,
            venue
          ),
          users (
            id,
            first_name,
            last_name,
            phone_number
          )
        `)
        .eq('qr_code', qrCode)
        .single();

      if (ticketError || !ticket) {
        throw new Error('Invalid QR code - ticket not found');
      }

      // Check if ticket is already used
      if (ticket.status === 'used') {
        setVerificationResult({
          valid: false,
          message: 'This ticket has already been used',
          ticket: ticket,
          usedAt: ticket.used_at,
        });
        return;
      }

      // Check if ticket is valid
      if (ticket.status !== 'confirmed') {
        setVerificationResult({
          valid: false,
          message: `Ticket is ${ticket.status} - not valid for entry`,
          ticket: ticket,
        });
        return;
      }

      // Record the scan
      const { error: scanError } = await supabase
        .from('ticket_scans')
        .insert({
          ticket_id: ticket.id,
          scanned_by: scannerId,
          scanned_at: new Date().toISOString(),
          location: 'Event Entrance',
          device_info: navigator.userAgent,
        });

      if (scanError) {
        console.warn('Failed to record scan:', scanError);
      }

      setVerificationResult({
        valid: true,
        message: 'Valid ticket - entry allowed',
        ticket: ticket,
      });
    } catch (err: any) {
      console.error('Verification error:', err);
      
      // If network error, queue the scan
      if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('connection')) {
        offlineScanQueue.queueScan({
          qrCode,
          scannedBy: scannerId,
          location: 'Event Entrance',
          deviceInfo: navigator.userAgent,
        });

        setError('Network error. Scan has been queued and will be processed when connection is restored.');
        updatePendingCount();
      } else {
        setError(err.message || 'Failed to verify ticket');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackupCodeSubmit = async (backupCode: string) => {
    setIsVerifying(true);
    setError(null);

    // If offline, queue the scan
    if (!navigator.onLine) {
      offlineScanQueue.queueScan({
        backupCode,
        scannedBy: scannerId,
        location: 'Event Entrance',
        deviceInfo: navigator.userAgent,
      });

      setError('You are offline. Scan has been queued and will be processed when connection is restored.');
      updatePendingCount();
      setIsVerifying(false);
      return;
    }

    try {
      // Verify backup code using Supabase
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      // Find the ticket by backup code
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            date,
            venue
          ),
          users (
            id,
            first_name,
            last_name,
            phone_number
          )
        `)
        .eq('backup_code', backupCode)
        .single();

      if (ticketError || !ticket) {
        throw new Error('Invalid backup code - ticket not found');
      }

      // Check if ticket is already used
      if (ticket.status === 'used') {
        setVerificationResult({
          valid: false,
          message: 'This ticket has already been used',
          ticket: ticket,
          usedAt: ticket.used_at,
        });
        return;
      }

      // Check if ticket is valid
      if (ticket.status !== 'confirmed') {
        setVerificationResult({
          valid: false,
          message: `Ticket is ${ticket.status} - not valid for entry`,
          ticket: ticket,
        });
        return;
      }

      // Record the scan
      const { error: scanError } = await supabase
        .from('ticket_scans')
        .insert({
          ticket_id: ticket.id,
          scanned_by: scannerId,
          scanned_at: new Date().toISOString(),
          location: 'Event Entrance',
          device_info: navigator.userAgent,
          scan_method: 'backup_code',
        });

      if (scanError) {
        console.warn('Failed to record scan:', scanError);
      }

      setVerificationResult({
        valid: true,
        message: 'Valid ticket - entry allowed (backup code)',
        ticket: ticket,
      });
    } catch (err: any) {
      console.error('Verification error:', err);
      
      // If network error, queue the scan
      if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('connection')) {
        offlineScanQueue.queueScan({
          backupCode,
          scannedBy: scannerId,
          location: 'Event Entrance',
          deviceInfo: navigator.userAgent,
        });

        setError('Network error. Scan has been queued and will be processed when connection is restored.');
        updatePendingCount();
      } else {
        setError(err.message || 'Failed to verify ticket');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!verificationResult?.ticket) return;

    setIsVerifying(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      // Mark ticket as used
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          scanned_by: scannerId,
        })
        .eq('id', verificationResult.ticket.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update verification result to show ticket is now used
      setVerificationResult({
        ...verificationResult,
        ticket: {
          ...verificationResult.ticket,
          status: 'used',
          used_at: new Date().toISOString(),
          scanned_by: scannerName,
        },
      });

      // Show success message
      alert('Ticket marked as used successfully!');
    } catch (err: any) {
      console.error('Error marking ticket as used:', err);
      setError(err.message || 'Failed to mark ticket as used');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setVerificationResult(null);
    setError(null);
    setUseBackupCode(false);
  };

  return (
    <div className="ticket-verification-page">
      <div className="page-header">
        <h1>Ticket Verification</h1>
        <p>Scan QR codes or enter backup codes to verify tickets</p>
        
        {/* Online/Offline indicator */}
        <div className={`connectivity-status ${isOnline ? 'online' : 'offline'}`}>
          <span className="status-dot" />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Pending scans indicator */}
        {pendingScans > 0 && (
          <div className="pending-scans-alert">
            <p>
              {pendingScans} scan{pendingScans > 1 ? 's' : ''} queued for processing
            </p>
            {isOnline && (
              <button
                onClick={() => {
                  offlineScanQueue.processQueue();
                  updatePendingCount();
                }}
                className="btn-small"
              >
                Process Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toggle between QR scanner and backup code input */}
      <div className="verification-mode-toggle">
        <button
          onClick={() => setUseBackupCode(false)}
          className={!useBackupCode ? 'active' : ''}
        >
          QR Code Scanner
        </button>
        <button
          onClick={() => setUseBackupCode(true)}
          className={useBackupCode ? 'active' : ''}
        >
          Backup Code
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Loading indicator */}
      {isVerifying && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Verifying ticket...</p>
        </div>
      )}

      {/* Show verification result if available */}
      {verificationResult ? (
        <VerificationResult
          valid={verificationResult.valid}
          message={verificationResult.message}
          ticket={verificationResult.ticket}
          usedAt={verificationResult.usedAt}
          scanHistory={verificationResult.scanHistory}
          onClose={handleClose}
          onMarkAsUsed={
            verificationResult.valid &&
            verificationResult.ticket?.status === 'valid'
              ? handleMarkAsUsed
              : undefined
          }
        />
      ) : (
        <>
          {/* QR Scanner or Backup Code Input */}
          {!useBackupCode ? (
            <TicketScanner
              onScanSuccess={handleScanSuccess}
              onScanError={(err) => setError(err)}
            />
          ) : (
            <BackupCodeInput
              onSubmit={handleBackupCodeSubmit}
              isVerifying={isVerifying}
            />
          )}
        </>
      )}

      {/* Statistics (optional) */}
      <div className="verification-stats">
        <h3>Today's Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-value">0</p>
            <p className="stat-label">Tickets Scanned</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">0</p>
            <p className="stat-label">Valid Tickets</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">0</p>
            <p className="stat-label">Duplicates Detected</p>
          </div>
        </div>
      </div>
    </div>
  );
};
