import { useState, useEffect } from 'react';

export interface OfflineSyncHook {
  isOnline: boolean;
  syncPending: boolean;
  syncData: () => Promise<void>;
}

export const useOfflineSync = (): OfflineSyncHook => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(false);

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
    try {
      // Sync offline data when connection is restored
      const offlineData = localStorage.getItem('offlineData');
      if (offlineData) {
        // Process offline data
        localStorage.removeItem('offlineData');
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncPending(false);
    }
  };

  return {
    isOnline,
    syncPending,
    syncData
  };
};