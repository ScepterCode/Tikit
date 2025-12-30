/**
 * Offline Wallet Component
 * Displays user's tickets with offline access capability
 */

import { useState, useEffect } from 'react';
import { offlineStorage, OfflineTicket } from '../../services/offlineStorage';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { QRCodeDisplay } from './QRCodeDisplay';
import { OfflineIndicator } from './OfflineIndicator';

export const OfflineWallet = () => {
  const [tickets, setTickets] = useState<OfflineTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<OfflineTicket | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Use offline sync hook
  const {
    isOnline,
    isSyncing,
    lastSyncAt,
    syncErrors,
    forceSync,
    clearErrors,
  } = useOfflineSync();

  useEffect(() => {
    loadTickets();
  }, []);

  // Reload tickets when sync completes
  useEffect(() => {
    if (!isSyncing && lastSyncAt) {
      loadTickets();
    }
  }, [isSyncing, lastSyncAt]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      await offlineStorage.init();
      const allTickets = await offlineStorage.getAllTickets();
      setTickets(allTickets);
    } catch (err) {
      setError('Failed to load tickets');
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticket: OfflineTicket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseQR = () => {
    setSelectedTicket(null);
  };

  const handleSyncNow = async () => {
    try {
      await forceSync();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleClearErrors = () => {
    clearErrors();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTickets}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
              <p className="text-sm text-gray-600 mt-1">
                {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OfflineIndicator isOnline={isOnline} />
              
              {/* Sync Status */}
              {isOnline && (
                <div className="flex items-center gap-2">
                  {isSyncing ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Syncing...</span>
                    </div>
                  ) : lastSyncAt ? (
                    <div className="text-xs text-gray-500">
                      Last synced: {new Date(lastSyncAt).toLocaleTimeString()}
                    </div>
                  ) : null}
                  
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Sync now"
                    title="Sync with server"
                  >
                    <svg
                      className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  aria-label="Grid view"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  aria-label="List view"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Sync Errors */}
          {syncErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Sync errors occurred
                  </p>
                  <ul className="mt-1 text-xs text-red-700 space-y-1">
                    {syncErrors.map((err, idx) => (
                      <li key={idx}>{err.error}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={handleClearErrors}
                  className="ml-3 text-red-600 hover:text-red-800"
                  aria-label="Clear errors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tickets */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tickets yet
            </h3>
            <p className="text-gray-600">
              Your purchased tickets will appear here
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            }
          >
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleTicketClick(ticket)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Event Image */}
                {ticket.eventDetails.images.length > 0 && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={ticket.eventDetails.images[0]}
                      alt={ticket.eventDetails.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {ticket.tierDetails.name}
                    </span>
                  </div>

                  {/* Event Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {ticket.eventDetails.title}
                  </h3>

                  {/* Event Details */}
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {formatDate(ticket.eventDetails.startDate)} at{' '}
                        {formatTime(ticket.eventDetails.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="line-clamp-1">
                        {ticket.eventDetails.venue}
                      </span>
                    </div>
                  </div>

                  {/* Backup Code */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Backup Code</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">
                      {ticket.backupCode}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedTicket && (
        <QRCodeDisplay ticket={selectedTicket} onClose={handleCloseQR} />
      )}
    </div>
  );
};
