import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: tikit-webapp, Property 52: Offline scan queueing
 * Validates: Requirements 14.5
 * 
 * For any scan performed while offline, the validation request should be 
 * queued and processed when connectivity is restored
 */

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Import after mocks are set up
import { offlineScanQueue } from './offlineScanQueue';

describe('Property 52: Offline scan queueing', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    
    // Reset fetch mock
    vi.clearAllMocks();
    
    // Clear queue
    offlineScanQueue.clearAll();
    
    // Set online by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should queue scans when offline and process when online', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }), // QR code
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        fc.string({ minLength: 3, maxLength: 50 }), // Location
        async (qrCode, scannerId, location) => {
          // Set offline
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
          });

          // Queue a scan while offline
          const scanId = offlineScanQueue.queueScan({
            qrCode,
            scannedBy: scannerId,
            location,
            deviceInfo: 'Test Device',
          });

          // Property: Scan should be queued
          expect(scanId).toBeDefined();
          expect(typeof scanId).toBe('string');

          // Property: Pending count should increase
          expect(offlineScanQueue.getPendingCount()).toBe(1);

          // Property: Scan should be in queue
          const queuedScan = offlineScanQueue.getScan(scanId);
          expect(queuedScan).toBeDefined();
          expect(queuedScan?.status).toBe('pending');
          expect(queuedScan?.qrCode).toBe(qrCode);
          expect(queuedScan?.scannedBy).toBe(scannerId);
          expect(queuedScan?.location).toBe(location);

          // Property: Queue should be persisted to localStorage
          const stored = localStorage.getItem('tikit_offline_scan_queue');
          expect(stored).toBeDefined();
          const storedQueue = JSON.parse(stored!);
          expect(storedQueue.length).toBe(1);
          expect(storedQueue[0].id).toBe(scanId);

          // Set online
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
          });

          // Mock successful API response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              valid: true,
              message: 'Ticket is valid',
              ticket: { id: 'test-ticket' },
            }),
          });

          // Process queue
          await offlineScanQueue.processQueue();

          // Property: Scan should be processed
          const processedScan = offlineScanQueue.getScan(scanId);
          expect(processedScan?.status).toBe('completed');
          expect(processedScan?.result).toBeDefined();

          // Property: Pending count should decrease
          expect(offlineScanQueue.getPendingCount()).toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle multiple queued scans', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 2, maxLength: 10 }), // Multiple QR codes
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        async (qrCodes, scannerId) => {
          // Set offline
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
          });

          // Queue multiple scans
          const scanIds: string[] = [];
          for (const qrCode of qrCodes) {
            const scanId = offlineScanQueue.queueScan({
              qrCode,
              scannedBy: scannerId,
              location: 'Event Entrance',
              deviceInfo: 'Test Device',
            });
            scanIds.push(scanId);
          }

          // Property: All scans should be queued
          expect(offlineScanQueue.getPendingCount()).toBe(qrCodes.length);

          // Property: Each scan should have unique ID
          const uniqueIds = new Set(scanIds);
          expect(uniqueIds.size).toBe(qrCodes.length);

          // Set online
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
          });

          // Mock successful API responses for all scans
          for (let i = 0; i < qrCodes.length; i++) {
            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                valid: true,
                message: 'Ticket is valid',
                ticket: { id: `test-ticket-${i}` },
              }),
            });
          }

          // Process queue
          await offlineScanQueue.processQueue();

          // Property: All scans should be processed
          for (const scanId of scanIds) {
            const scan = offlineScanQueue.getScan(scanId);
            expect(scan?.status).toBe('completed');
          }

          // Property: Pending count should be zero
          expect(offlineScanQueue.getPendingCount()).toBe(0);
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should handle failed scans and allow retry', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }), // QR code
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        async (qrCode, scannerId) => {
          // Set offline
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
          });

          // Queue a scan
          const scanId = offlineScanQueue.queueScan({
            qrCode,
            scannedBy: scannerId,
            location: 'Event Entrance',
            deviceInfo: 'Test Device',
          });

          // Set online
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
          });

          // Mock failed API response
          (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

          // Process queue
          await offlineScanQueue.processQueue();

          // Property: Scan should be marked as failed
          let scan = offlineScanQueue.getScan(scanId);
          expect(scan?.status).toBe('failed');
          expect(scan?.error).toBeDefined();

          // Mock successful API response for retry
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              valid: true,
              message: 'Ticket is valid',
              ticket: { id: 'test-ticket' },
            }),
          });

          // Retry failed scans
          await offlineScanQueue.retryFailed();

          // Property: Scan should now be completed
          scan = offlineScanQueue.getScan(scanId);
          expect(scan?.status).toBe('completed');
          expect(scan?.result).toBeDefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should persist queue across page reloads', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }), // QR code
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        async (qrCode, scannerId) => {
          // Set offline
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
          });

          // Queue a scan
          const scanId = offlineScanQueue.queueScan({
            qrCode,
            scannedBy: scannerId,
            location: 'Event Entrance',
            deviceInfo: 'Test Device',
          });

          // Property: Queue should be in localStorage
          const stored = localStorage.getItem('tikit_offline_scan_queue');
          expect(stored).toBeDefined();

          // Simulate page reload by creating new instance
          const { offlineScanQueue: newQueue } = await import('./offlineScanQueue');

          // Property: Queue should be restored
          expect(newQueue.getPendingCount()).toBe(1);
          const restoredScan = newQueue.getScan(scanId);
          expect(restoredScan).toBeDefined();
          expect(restoredScan?.qrCode).toBe(qrCode);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should work with backup codes as well', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^\d{6}$/.test(s)), // Backup code
        fc.string({ minLength: 5, maxLength: 20 }), // Scanner ID
        async (backupCode, scannerId) => {
          // Set offline
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
          });

          // Queue a scan with backup code
          const scanId = offlineScanQueue.queueScan({
            backupCode,
            scannedBy: scannerId,
            location: 'Event Entrance',
            deviceInfo: 'Test Device',
          });

          // Property: Scan should be queued
          expect(offlineScanQueue.getPendingCount()).toBe(1);

          // Property: Scan should have backup code
          const scan = offlineScanQueue.getScan(scanId);
          expect(scan?.backupCode).toBe(backupCode);
          expect(scan?.qrCode).toBeUndefined();

          // Set online
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
          });

          // Mock successful API response
          (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              valid: true,
              message: 'Ticket is valid',
              ticket: { id: 'test-ticket' },
            }),
          });

          // Process queue
          await offlineScanQueue.processQueue();

          // Property: Scan should be processed
          const processedScan = offlineScanQueue.getScan(scanId);
          expect(processedScan?.status).toBe('completed');
        }
      ),
      { numRuns: 10 }
    );
  });
});
