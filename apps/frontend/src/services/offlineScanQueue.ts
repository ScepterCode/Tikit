/**
 * Offline Scan Queue Service
 * 
 * Handles queueing of ticket verification requests when offline
 * and processes them when connectivity is restored
 */

import { supabase } from '../lib/supabase';

interface QueuedScan {
  id: string;
  qrCode?: string;
  backupCode?: string;
  scannedBy: string;
  location?: string;
  deviceInfo?: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

const QUEUE_STORAGE_KEY = 'tikit_offline_scan_queue';

class OfflineScanQueueService {
  private queue: QueuedScan[] = [];
  private isProcessing = false;

  constructor() {
    this.loadQueue();
    this.setupConnectivityListener();
  }

  /**
   * Load queue from local storage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`Loaded ${this.queue.length} queued scans from storage`);
      }
    } catch (error) {
      console.error('Failed to load scan queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to local storage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save scan queue:', error);
    }
  }

  /**
   * Setup connectivity listener to process queue when online
   */
  private setupConnectivityListener(): void {
    window.addEventListener('online', () => {
      console.log('Connection restored, processing queued scans...');
      this.processQueue();
    });
  }

  /**
   * Add a scan to the queue
   */
  queueScan(scan: Omit<QueuedScan, 'id' | 'timestamp' | 'status'>): string {
    const queuedScan: QueuedScan = {
      ...scan,
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.queue.push(queuedScan);
    this.saveQueue();

    console.log(`Queued scan ${queuedScan.id} for offline processing`);

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return queuedScan.id;
  }

  /**
   * Process all pending scans in the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('Queue processing already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Cannot process queue while offline');
      return;
    }

    const pendingScans = this.queue.filter(scan => scan.status === 'pending');
    if (pendingScans.length === 0) {
      console.log('No pending scans to process');
      return;
    }

    this.isProcessing = true;
    console.log(`Processing ${pendingScans.length} queued scans...`);

    for (const scan of pendingScans) {
      await this.processScan(scan);
    }

    this.isProcessing = false;
    this.saveQueue();

    console.log('Queue processing complete');
  }

  /**
   * Process a single scan using Supabase
   */
  private async processScan(scan: QueuedScan): Promise<void> {
    scan.status = 'processing';
    this.saveQueue();

    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      let result;

      if (scan.qrCode) {
        // Verify by QR code using Supabase
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
          .eq('qr_code', scan.qrCode)
          .single();

        if (ticketError || !ticket) {
          throw new Error('Invalid QR code - ticket not found');
        }

        // Check if ticket is already used
        if (ticket.status === 'used') {
          result = {
            valid: false,
            message: 'This ticket has already been used',
            ticket: ticket,
            usedAt: ticket.used_at,
          };
        } else if (ticket.status !== 'confirmed') {
          result = {
            valid: false,
            message: `Ticket is ${ticket.status} - not valid for entry`,
            ticket: ticket,
          };
        } else {
          // Record the scan
          const { error: scanError } = await supabase
            .from('ticket_scans')
            .insert({
              ticket_id: ticket.id,
              scanned_by: scan.scannedBy,
              scanned_at: new Date().toISOString(),
              location: scan.location || 'Event Entrance',
              device_info: scan.deviceInfo,
            });

          if (scanError) {
            console.warn('Failed to record scan:', scanError);
          }

          result = {
            valid: true,
            message: 'Valid ticket - entry allowed',
            ticket: ticket,
          };
        }
      } else if (scan.backupCode) {
        // Verify by backup code using Supabase
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
          .eq('backup_code', scan.backupCode)
          .single();

        if (ticketError || !ticket) {
          throw new Error('Invalid backup code - ticket not found');
        }

        // Check if ticket is already used
        if (ticket.status === 'used') {
          result = {
            valid: false,
            message: 'This ticket has already been used',
            ticket: ticket,
            usedAt: ticket.used_at,
          };
        } else if (ticket.status !== 'confirmed') {
          result = {
            valid: false,
            message: `Ticket is ${ticket.status} - not valid for entry`,
            ticket: ticket,
          };
        } else {
          // Record the scan
          const { error: scanError } = await supabase
            .from('ticket_scans')
            .insert({
              ticket_id: ticket.id,
              scanned_by: scan.scannedBy,
              scanned_at: new Date().toISOString(),
              location: scan.location || 'Event Entrance',
              device_info: scan.deviceInfo,
              scan_method: 'backup_code',
            });

          if (scanError) {
            console.warn('Failed to record scan:', scanError);
          }

          result = {
            valid: true,
            message: 'Valid ticket - entry allowed (backup code)',
            ticket: ticket,
          };
        }
      } else {
        throw new Error('No QR code or backup code provided');
      }

      scan.status = 'completed';
      scan.result = result;
      console.log(`Successfully processed scan ${scan.id}`);
    } catch (error: any) {
      scan.status = 'failed';
      scan.error = error.message || 'Failed to process scan';
      console.error(`Failed to process scan ${scan.id}:`, error);
    }

    this.saveQueue();
  }

  /**
   * Get all queued scans
   */
  getQueue(): QueuedScan[] {
    return [...this.queue];
  }

  /**
   * Get pending scans count
   */
  getPendingCount(): number {
    return this.queue.filter(scan => scan.status === 'pending').length;
  }

  /**
   * Get a specific scan by ID
   */
  getScan(id: string): QueuedScan | undefined {
    return this.queue.find(scan => scan.id === id);
  }

  /**
   * Clear completed scans from queue
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(scan => scan.status !== 'completed');
    this.saveQueue();
    console.log('Cleared completed scans from queue');
  }

  /**
   * Clear all scans from queue
   */
  clearAll(): void {
    this.queue = [];
    this.saveQueue();
    console.log('Cleared all scans from queue');
  }

  /**
   * Retry failed scans
   */
  async retryFailed(): Promise<void> {
    const failedScans = this.queue.filter(scan => scan.status === 'failed');
    
    if (failedScans.length === 0) {
      console.log('No failed scans to retry');
      return;
    }

    console.log(`Retrying ${failedScans.length} failed scans...`);

    // Reset failed scans to pending
    failedScans.forEach(scan => {
      scan.status = 'pending';
      scan.error = undefined;
    });

    this.saveQueue();

    // Process queue
    await this.processQueue();
  }
}

// Export singleton instance
export const offlineScanQueue = new OfflineScanQueueService();
