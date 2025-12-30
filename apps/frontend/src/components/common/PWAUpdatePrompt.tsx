import { useServiceWorker } from '../../hooks/useServiceWorker';

/**
 * Component to prompt users when a new version is available
 * or when the app is ready for offline use
 */
export function PWAUpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker } = useServiceWorker();

  if (!needRefresh && !offlineReady) {
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
                A new version of Tikit is available. Refresh to update.
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

      {offlineReady && !needRefresh && (
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Ready for Offline Use</h3>
              <p className="text-sm">
                Tikit is now available offline. You can access your tickets without internet.
              </p>
            </div>
            <button
              onClick={() => {
                // Close notification
                const element = document.querySelector('[data-offline-ready]');
                element?.remove();
              }}
              className="ml-2 text-white hover:text-gray-200"
              data-offline-ready
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
