import { useEffect, useState } from 'react';
import { useRegisterSW } from '../lib/pwa-register';

interface ServiceWorkerState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

/**
 * Hook to manage service worker registration and updates
 * Provides offline-ready status and update notifications
 */
export function useServiceWorker(): ServiceWorkerState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const {
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      console.log('Service Worker registered:', registration);
      
      // Check for updates every hour
      setInterval(() => {
        registration?.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error: any) {
      console.error('Service Worker registration error:', error);
    },
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onOfflineReady() {
      setOfflineReady(true);
    },
  });

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  };
}

/**
 * Hook to check online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return isOnline;
}

/**
 * Hook to request persistent storage for offline data
 */
export function usePersistentStorage() {
  const [isPersisted, setIsPersisted] = useState(false);

  useEffect(() => {
    async function checkPersistence() {
      if (navigator.storage && navigator.storage.persist) {
        const persisted = await navigator.storage.persisted();
        setIsPersisted(persisted);

        if (!persisted) {
          const result = await navigator.storage.persist();
          setIsPersisted(result);
        }
      }
    }

    checkPersistence();
  }, []);

  return isPersisted;
}
