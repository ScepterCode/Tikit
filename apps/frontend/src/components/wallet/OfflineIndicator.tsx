/**
 * Offline Indicator Component
 * Shows online/offline status
 */

interface OfflineIndicatorProps {
  isOnline: boolean;
}

export const OfflineIndicator = ({ isOnline }: OfflineIndicatorProps) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
        aria-label={isOnline ? 'Online' : 'Offline'}
      />
      <span className="text-sm text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};
