import React, { useState } from 'react';

interface BroadcastComposerProps {
  eventId: string;
  eventTitle: string;
  ticketHolderCount: number;
  onSendBroadcast: (eventId: string, message: string) => Promise<{
    success: boolean;
    message: string;
    sentCount?: number;
    failedCount?: number;
    totalRecipients?: number;
  }>;
}

export const BroadcastComposer: React.FC<BroadcastComposerProps> = ({
  eventId,
  eventTitle,
  ticketHolderCount,
  onSendBroadcast,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    sentCount?: number;
    failedCount?: number;
    totalRecipients?: number;
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const maxLength = 1000;
  const remainingChars = maxLength - message.length;

  const handleSend = async () => {
    if (!message.trim()) {
      setResult({
        success: false,
        message: 'Please enter a message',
      });
      return;
    }

    try {
      setSending(true);
      setResult(null);
      const response = await onSendBroadcast(eventId, message);
      setResult(response);
      
      if (response.success) {
        // Clear message on success
        setMessage('');
        setShowConfirmation(false);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to send broadcast. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => {
    if (ticketHolderCount > 100) {
      // Show confirmation for large broadcasts
      setShowConfirmation(true);
    } else {
      handleSend();
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleConfirmSend = () => {
    handleSend();
  };

  // Quick message templates
  const templates = [
    {
      label: 'Event Reminder',
      message: `Hi! This is a reminder about ${eventTitle}. We're looking forward to seeing you there! 🎉`,
    },
    {
      label: 'Venue Update',
      message: `Important update: The venue for ${eventTitle} has been updated. Please check the event details for the new location.`,
    },
    {
      label: 'Time Change',
      message: `Attention: The start time for ${eventTitle} has been changed. Please check the updated event details.`,
    },
    {
      label: 'Thank You',
      message: `Thank you for purchasing tickets to ${eventTitle}! We can't wait to see you there. 🙏`,
    },
  ];

  const insertTemplate = (templateMessage: string) => {
    setMessage(templateMessage);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">WhatsApp Broadcast</h3>
        <p className="text-sm text-gray-600">
          Send a message to all {ticketHolderCount} ticket holders via WhatsApp
        </p>
      </div>

      {/* Quick Templates */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Templates
        </label>
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <button
              key={template.label}
              onClick={() => insertTemplate(template.message)}
              disabled={sending}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="mb-4">
        <label htmlFor="broadcast-message" className="block text-sm font-medium text-gray-700 mb-2">
          Message
        </label>
        <textarea
          id="broadcast-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
          maxLength={maxLength}
          rows={6}
          placeholder="Type your message here..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            Your message will be sent via WhatsApp with event branding
          </span>
          <span
            className={`text-sm ${
              remainingChars < 100 ? 'text-orange-600' : 'text-gray-500'
            }`}
          >
            {remainingChars} characters remaining
          </span>
        </div>
      </div>

      {/* Preview */}
      {message.trim() && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-semibold text-gray-600 mb-2">Preview:</div>
          <div className="text-sm whitespace-pre-wrap">
            <div className="font-semibold mb-1">📢 {eventTitle}</div>
            <div className="mb-2">{message}</div>
            <div className="text-xs text-gray-500 italic">Sent via Tikit</div>
          </div>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {result.success ? (
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{result.message}</p>
              {result.success && result.sentCount !== undefined && (
                <div className="mt-2 text-sm">
                  <div>✓ Sent: {result.sentCount}</div>
                  {result.failedCount !== undefined && result.failedCount > 0 && (
                    <div className="text-orange-700">⚠ Failed: {result.failedCount}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Button */}
      {!showConfirmation && (
        <button
          onClick={handleSendClick}
          disabled={sending || !message.trim()}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {sending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Send WhatsApp Broadcast to {ticketHolderCount} Recipients
            </>
          )}
        </button>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="border-2 border-orange-300 bg-orange-50 rounded-lg p-4">
          <div className="flex items-start mb-4">
            <svg
              className="h-6 w-6 text-orange-600 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-orange-900 mb-1">
                Confirm Large Broadcast
              </h4>
              <p className="text-sm text-orange-800">
                You are about to send this message to {ticketHolderCount} recipients via WhatsApp.
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancelConfirmation}
              disabled={sending}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSend}
              disabled={sending}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {sending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                'Confirm & Send'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg
            className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">WhatsApp Broadcast Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Messages are sent to ticket holders who have valid phone numbers</li>
              <li>Keep messages concise and relevant to the event</li>
              <li>Include important details like date, time, or venue changes</li>
              <li>Avoid sending too many broadcasts to prevent spam complaints</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
