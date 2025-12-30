/**
 * Offline Storage Service
 * Manages ticket storage in IndexedDB for offline access
 */

export interface OfflineTicket {
  id: string;
  eventId: string;
  userId: string;
  tierId: string;
  qrCode: string;
  backupCode: string;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  purchaseDate: string;
  usedAt?: string;
  eventDetails: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    venue: string;
    state: string;
    lga: string;
    images: string[];
  };
  tierDetails: {
    name: string;
    price: number;
  };
  culturalSelections?: {
    asoEbiTier?: string;
    foodChoice?: string;
  };
  lastSyncedAt: string;
}

const DB_NAME = 'TikitOfflineDB';
const DB_VERSION = 1;
const TICKET_STORE = 'tickets';
const QUOTA_WARNING_THRESHOLD = 0.9; // 90% of quota

class OfflineStorageService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create tickets object store if it doesn't exist
        if (!db.objectStoreNames.contains(TICKET_STORE)) {
          const ticketStore = db.createObjectStore(TICKET_STORE, {
            keyPath: 'id',
          });

          // Create indexes for efficient querying
          ticketStore.createIndex('eventId', 'eventId', { unique: false });
          ticketStore.createIndex('userId', 'userId', { unique: false });
          ticketStore.createIndex('status', 'status', { unique: false });
          ticketStore.createIndex('purchaseDate', 'purchaseDate', {
            unique: false,
          });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Store a ticket in IndexedDB
   */
  async storeTicket(ticket: OfflineTicket): Promise<void> {
    const db = await this.ensureDB();

    // Check storage quota before storing
    await this.checkStorageQuota();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TICKET_STORE], 'readwrite');
      const store = transaction.objectStore(TICKET_STORE);

      const request = store.put(ticket);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to store ticket'));
      };
    });
  }

  /**
   * Store multiple tickets in a batch
   */
  async storeTickets(tickets: OfflineTicket[]): Promise<void> {
    const db = await this.ensureDB();

    // Check storage quota before storing
    await this.checkStorageQuota();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TICKET_STORE], 'readwrite');
      const store = transaction.objectStore(TICKET_STORE);

      let completed = 0;
      let hasError = false;

      tickets.forEach((ticket) => {
        const request = store.put(ticket);

        request.onsuccess = () => {
          completed++;
          if (completed === tickets.length && !hasError) {
            resolve();
          }
        };

        request.onerror = () => {
          hasError = true;
          reject(new Error('Failed to store tickets'));
        };
      });

      if (tickets.length === 0) {
        resolve();
      }
    });
  }

  /**
   * Retrieve a ticket by ID
   */
  async getTicket(ticketId: string): Promise<OfflineTicket | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TICKET_STORE], 'readonly');
      const store = transaction.objectStore(TICKET_STORE);

      const request = store.get(ticketId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve ticket'));
      };
    });
  }

  /**
   * Retrieve all tickets for a user
   */
  async getUserTickets(userId: string): Promise<OfflineTicket[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TICKET_STORE], 'readonly');
      const store = transaction.objectStore(TICKET_STORE);
      const index = store.index('userId');

      const request = index.getAll(userId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve user tickets'));
      };
    });
  }

  /**
   * Retrieve all tickets
   */
  async getAllTickets(): Promise<OfflineTicket[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TICKET_STORE], 'readonly');
      const store = transaction.objectStore(TICKET_STORE);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve tickets'));
      };
    });
  }

  /**
   * Update a ticket
   */
  async updateTicket(ticket: OfflineTicket): Promise<void> {
    return this.storeTicket(ticket);
  }

  /**
   * Delete a ticket
   */
  async deleteTicket(ticketId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TICKET_STORE], 'readwrite');
      const store = transaction.objectStore(TICKET_STORE);

      const request = store.delete(ticketId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete ticket'));
      };
    });
  }

  /**
   * Clear all tickets
   */
  async clearAllTickets(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TICKET_STORE], 'readwrite');
      const store = transaction.objectStore(TICKET_STORE);

      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear tickets'));
      };
    });
  }

  /**
   * Check storage quota and warn if approaching limit
   */
  async checkStorageQuota(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
    isNearLimit: boolean;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? usage / quota : 0;
      const isNearLimit = percentage >= QUOTA_WARNING_THRESHOLD;

      if (isNearLimit) {
        console.warn(
          `Storage quota warning: ${(percentage * 100).toFixed(1)}% used (${this.formatBytes(usage)} / ${this.formatBytes(quota)})`
        );
      }

      return {
        usage,
        quota,
        percentage,
        isNearLimit,
      };
    }

    // Fallback for browsers that don't support storage estimation
    return {
      usage: 0,
      quota: 0,
      percentage: 0,
      isNearLimit: false,
    };
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get storage info
   */
  async getStorageInfo(): Promise<{
    ticketCount: number;
    storageUsage: {
      usage: number;
      quota: number;
      percentage: number;
      isNearLimit: boolean;
    };
  }> {
    const tickets = await this.getAllTickets();
    const storageUsage = await this.checkStorageQuota();

    return {
      ticketCount: tickets.length,
      storageUsage,
    };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
