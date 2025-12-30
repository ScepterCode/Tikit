# Offline Sync Service

## Overview

The Offline Sync Service provides automatic synchronization between local IndexedDB storage and the server. It detects connectivity changes and ensures that ticket data remains consistent across offline and online states.

## Features

- **Automatic Connectivity Detection**: Listens for online/offline events
- **Automatic Sync on Reconnection**: Syncs data when connection is restored
- **Conflict Resolution**: Server-wins strategy for resolving data conflicts
- **Event-Based Updates**: Emits events for sync lifecycle (start, complete, error)
- **Manual Sync Trigger**: Allows forcing sync on demand

## Usage

### Basic Usage with React Hook

```typescript
import { useOfflineSync } from '../hooks/useOfflineSync';

function MyComponent() {
  const {
    isOnline,
    isSyncing,
    lastSyncAt,
    syncErrors,
    forceSync,
    clearErrors,
  } = useOfflineSync();

  return (
    <div>
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
      {isSyncing && <p>Syncing...</p>}
      {lastSyncAt && <p>Last synced: {new Date(lastSyncAt).toLocaleString()}</p>}
      
      <button onClick={forceSync} disabled={!isOnline || isSyncing}>
        Sync Now
      </button>
      
      {syncErrors.length > 0 && (
        <div>
          <p>Sync errors:</p>
          <ul>
            {syncErrors.map((err, idx) => (
              <li key={idx}>{err.error}</li>
            ))}
          </ul>
          <button onClick={clearErrors}>Clear Errors</button>
        </div>
      )}
    </div>
  );
}
```

### Direct Service Usage

```typescript
import { offlineSync } from '../services/offlineSync';

// Get current sync status
const status = offlineSync.getSyncStatus();
console.log('Is online:', status.isOnline);
console.log('Is syncing:', status.isSyncing);
console.log('Last sync:', status.lastSyncAt);

// Force sync manually
try {
  await offlineSync.forceSyncNow();
  console.log('Sync completed');
} catch (error) {
  console.error('Sync failed:', error);
}

// Listen to sync events
offlineSync.on('sync-start', () => {
  console.log('Sync started');
});

offlineSync.on('sync-complete', (data) => {
  console.log('Sync completed:', data);
});

offlineSync.on('sync-error', (error) => {
  console.error('Sync error:', error);
});

offlineSync.on('online', () => {
  console.log('Connection restored');
});

offlineSync.on('offline', () => {
  console.log('Connection lost');
});

// Clean up listeners
offlineSync.off('sync-start', myListener);
```

## Sync Behavior

### Automatic Sync

The service automatically syncs in the following scenarios:

1. **On Initialization**: Attempts initial sync 1 second after service creation (if online)
2. **On Reconnection**: Syncs immediately when connection is restored
3. **Manual Trigger**: When `forceSyncNow()` is called

### Conflict Resolution

When conflicts are detected between local and server data, the service uses a **server-wins** strategy:

- Server data is considered authoritative
- Local changes are overwritten with server data
- Conflicts are logged for debugging

### Data Synchronization

The sync process:

1. Fetches all tickets from server (`/api/tickets/my-tickets`)
2. Compares with local tickets in IndexedDB
3. Detects conflicts (status mismatches, data differences)
4. Resolves conflicts (server wins)
5. Updates local storage:
   - Adds/updates tickets from server
   - Removes tickets that no longer exist on server
6. Updates sync status and timestamp

## Error Handling

Sync errors are captured and stored in the sync status. Common errors:

- **No authentication token**: User not logged in
- **Network error**: Failed to reach server
- **Server error**: API returned error response
- **Storage error**: Failed to update local storage

Errors can be cleared using `clearSyncErrors()` or the `clearErrors()` function from the hook.

## Configuration

The service uses the following environment variable:

- `VITE_API_URL`: Base URL for API requests (defaults to `http://localhost:3000`)

## Authentication

The service requires an authentication token stored in localStorage:

- Looks for `authToken` or `token` key
- Token is sent in `Authorization: Bearer <token>` header
- Sync fails if no token is found

## Events

The service emits the following events:

- `sync-start`: Sync operation started
- `sync-complete`: Sync operation completed successfully (includes ticket count)
- `sync-error`: Sync operation failed (includes error details)
- `online`: Connection restored
- `offline`: Connection lost

## Testing

Run tests with:

```bash
npm test src/services/offlineSync.test.ts
```

## Implementation Details

### Sync Status Interface

```typescript
interface SyncStatus {
  isOnline: boolean;
  lastSyncAt: string | null;
  isSyncing: boolean;
  pendingChanges: number;
  syncErrors: SyncError[];
}
```

### Conflict Types

```typescript
type ConflictType = 'status_mismatch' | 'data_mismatch';
```

### Server Response Format

The service expects tickets from the server in this format:

```typescript
{
  tickets: [
    {
      id: string;
      eventId: string;
      userId: string;
      tierId: string;
      qrCode: string;
      backupCode: string;
      status: 'valid' | 'used' | 'cancelled' | 'refunded';
      purchaseDate: string;
      usedAt?: string;
      event: {
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        venue: string;
        state: string;
        lga: string;
        images: string[];
      };
      tier: {
        name: string;
        price: number;
      };
      culturalSelections?: {
        asoEbiTier?: string;
        foodChoice?: string;
      };
    }
  ]
}
```

## Future Enhancements

Potential improvements:

1. **Optimistic Updates**: Allow local changes to be synced to server
2. **Selective Sync**: Sync only changed tickets instead of all tickets
3. **Retry Logic**: Automatic retry with exponential backoff on failure
4. **Sync Queue**: Queue local changes for upload when online
5. **Conflict UI**: User interface for manual conflict resolution
6. **Background Sync**: Use Service Worker Background Sync API
