import { useServiceWorker } from '../../hooks/useServiceWorker';
import { useState, useEffect } from 'react';

/**
 * Component to prompt users when a new version is available
 * or when the app is ready for offline use
 */
export function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker } = useServiceWorker();
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  // Only show offline ready notification once and allow dismissal
  useEffect(() => {
    if (offlineReady && !localStorage.getItem('pwa-offline-dismissed')) {
      setShowOfflineReady(true);
    }
  }, [offlineReady]);

  const dismissOfflineReady = () => {
    setShowOfflineReady(false);
    localStorage.setItem('pwa-offline-dismissed', 'true');
  };

  if (!needRefresh && !showOfflineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {needRefresh && (
        <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Update Available</h3>
              <p className="text-sm mb-3">
                A new version of Grooovy is available. Refresh to update.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="bg-white text-green-600 px-4 py-2 rounded font-medium text-sm hover:bg-gray-100"
                >
                  Update Now
                </button>
                <button
                  onClick={() => updateServiceWorker(false)}
                  className="bg-green-700 text-white px-4 py-2 rounded font-medium text-sm hover:bg-green-800"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOfflineReady && (
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Ready for Offline Use</h3>
              <p className="text-sm">
                Grooovy is now available offline. You can access your tickets without internet.
              </p>
            </div>
            <button
              onClick={dismissOfflineReady}
              className="ml-2 text-white hover:text-gray-200 text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
