/**
 * QR Code Display Component
 * Shows ticket QR code in full-screen mode
 */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { OfflineTicket } from '../../services/offlineStorage';
import {
  shareTicketViaWhatsApp,
  downloadTicketImage,
} from '../../services/ticketShare';

interface QRCodeDisplayProps {
  ticket: OfflineTicket;
  onClose: () => void;
}

export const QRCodeDisplay = ({ ticket, onClose }: QRCodeDisplayProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(ticket.qrCode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [ticket.qrCode]);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
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

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setShareError(null);
      await shareTicketViaWhatsApp(ticket);
    } catch (error) {
      console.error('Error sharing ticket:', error);
      setShareError('Failed to share ticket. Please try downloading instead.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsSharing(true);
      setShareError(null);
      await downloadTicketImage(ticket);
    } catch (error) {
      console.error('Error downloading ticket:', error);
      setShareError('Failed to download ticket image.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
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

        {/* Event Info */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 pr-8">
            {ticket.eventDetails.title}
          </h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p>{formatDate(ticket.eventDetails.startDate)}</p>
            <p>{formatTime(ticket.eventDetails.startDate)}</p>
            <p className="font-medium text-gray-900">
              {ticket.tierDetails.name} - ₦
              {ticket.tierDetails.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
          <div className="aspect-square bg-gray-100 flex items-center justify-center">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="Ticket QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Generating QR Code...</p>
              </div>
            )}
          </div>
        </div>

        {/* Backup Code */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-600 mb-1">Backup Code</p>
          <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider text-center">
            {ticket.backupCode}
          </p>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Use this code if QR scanner is unavailable
          </p>
        </div>

        {/* Status */}
        {ticket.status === 'used' && ticket.usedAt && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Ticket Used</span>
              <br />
              Scanned on {new Date(ticket.usedAt).toLocaleString('en-NG')}
            </p>
          </div>
        )}

        {ticket.status === 'valid' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800 text-center">
              ✓ This ticket is valid and ready to use
            </p>
          </div>
        )}

        {/* Share Error */}
        {shareError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{shareError}</p>
          </div>
        )}

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm font-medium">Sharing...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="text-sm font-medium">Share</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={isSharing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="text-sm font-medium">Download</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Present this QR code at the event entrance for scanning</p>
        </div>
      </div>
    </div>
  );
};
