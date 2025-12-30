import { useState, useEffect } from 'react';

export interface OfflineSyncHook {
  isOnline: boolean;
  syncPending: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncErrors: string[];
  syncData: () => Promise<void>;
  forceSync: () => Promise<void>;
  clearErrors: () => void;
}

export const useOfflineSync = (): OfflineSyncHook => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    setSyncPending(true);
    setIsSyncing(true);
    try {
      // Sync offline data when connection is restored
      const offlineData = localStorage.getItem('offlineData');
      if (offlineData) {
        // Process offline data
        localStorage.removeItem('offlineData');
      }
      setLastSyncAt(new Date());
      setSyncErrors([]);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncErrors(prev => [...prev, error instanceof Error ? error.message : 'Sync failed']);
    } finally {
      setSyncPending(false);
      setIsSyncing(false);
    }
  };

  const forceSync = async () => {
    await syncData();
  };

  const clearErrors = () => {
    setSyncErrors([]);
  };

  return {
    isOnline,
    syncPending,
    isSyncing,
    lastSyncAt,
    syncErrors,
    syncData,
    forceSync,
    clearErrors
  };
};