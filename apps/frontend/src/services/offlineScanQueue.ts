/**
 * Offline Scan Queue Service
 * 
 * Handles queueing of ticket verification requests when offline
 * and processes them when connectivity is restored
 */

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
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
   * Process a single scan
   */
  private async processScan(scan: QueuedScan): Promise<void> {
    scan.status = 'processing';
    this.saveQueue();

    try {
      let result;

      if (scan.qrCode) {
        // Verify by QR code
        const response = await fetch('/api/tickets/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qrCode: scan.qrCode,
            scannedBy: scan.scannedBy,
            location: scan.location,
            deviceInfo: scan.deviceInfo,
          }),
        });

        result = await response.json();
      } else if (scan.backupCode) {
        // Verify by backup code
        const response = await fetch('/api/tickets/verify-backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            backupCode: scan.backupCode,
            scannedBy: scan.scannedBy,
            location: scan.location,
            deviceInfo: scan.deviceInfo,
          }),
        });

        result = await response.json();
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
