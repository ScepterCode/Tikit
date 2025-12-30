// Mock PWA register for build compatibility
export interface RegisterSWOptions {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (error: any) => void;
}

export function useRegisterSW(options: RegisterSWOptions = {}) {
  const {
    immediate = true,
    onOfflineReady,
    onRegistered,
    onRegisterError,
  } = options;

  const needRefresh = [false, () => {}] as const;
  const offlineReady = [false, () => {}] as const;

  const updateServiceWorker = async (reloadPage?: boolean) => {
    if (reloadPage) {
      window.location.reload();
    }
  };

  // Mock registration for build compatibility
  if (immediate && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        onRegistered?.(registration);
        onOfflineReady?.();
      })
      .catch(error => {
        onRegisterError?.(error);
      });
  }

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  };
}