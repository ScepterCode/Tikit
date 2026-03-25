import React, { useState, useEffect } from 'react';
import { Crown, MapPin, Bell, Clock, Shield, Send, Eye } from 'lucide-react';

interface PremiumMessage {
  id: string;
  message: string;
  message_type: string;
  timestamp: number;
  priority: string;
  read_by: string[];
}

interface PremiumMessagePortalProps {
  eventId: string;
  userRole?: string;
  onClose?: () => void;
}

const PremiumMessagePortal: React.FC<PremiumMessagePortalProps> = ({ 
  eventId, 
  userRole = 'attendee',
  onClose 
}) => {
  const [messages, setMessages] = useState<PremiumMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<string>('announcement');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOrganizer = userRole === 'organizer';

  useEffect(() => {
    loadPremiumMessages();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(loadPremiumMessages, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  const loadPremiumMessages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/anonymous-chat/premium-messages/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages);
        setUnreadCount(data.data.unread_count);
      } else {
        setError(data.detail || 'Failed to load premium messages');
      }
    } catch (err) {
      console.error('Failed to load premium messages:', err);
    }
  };

  const sendPremiumMessage = async () => {
    if (!newMessage.trim() || !isOrganizer) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/anonymous-chat/send-premium-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: eventId,
          message: newMessage.trim(),
          message_type: messageType
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        await loadPremiumMessages(); // Reload to show new message
      } else {
        setError(data.detail || 'Failed to send premium message');
      }
    } catch (err) {
      setError('Failed to send premium message');
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'location_reveal':
        return <MapPin className="h-4 w-4 text-red-500" />;
      case 'announcement':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'update':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Shield className="h-4 w-4 text-purple-500" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'location_reveal':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'announcement':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'update':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-purple-50 border-purple-200 text-purple-800';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'location_reveal':
        return 'Location Reveal';
      case 'announcement':
        return 'Announcement';
      case 'update':
        return 'Event Update';
      default:
        return 'Premium Message';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="h-5 w-5 text-yellow-500 mr-2" />
            <div>
              <h3 className="font-semibold text-gray-900">Premium Message Portal</h3>
              <p className="text-sm text-gray-600">
                Secure messages for premium event attendees
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Crown className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No premium messages yet.</p>
            {isOrganizer && (
              <p className="text-sm mt-1">Send location reveals and updates to attendees.</p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`border rounded-lg p-4 ${getMessageTypeColor(message.message_type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getMessageIcon(message.message_type)}
                  <span className="font-medium text-sm">
                    {getMessageTypeLabel(message.message_type)}
                  </span>
                  {message.priority === 'high' && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                      High Priority
                    </span>
                  )}
                </div>
                <span className="text-xs opacity-75">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.message}
              </p>
              {message.message_type === 'location_reveal' && (
                <div className="mt-3 bg-white bg-opacity-50 rounded-lg p-3 border border-current border-opacity-20">
                  <div className="flex items-center text-sm font-medium">
                    <MapPin className="h-4 w-4 mr-2" />
                    Secret Location Revealed
                  </div>
                  <p className="text-xs mt-1 opacity-75">
                    This location information is confidential to premium attendees only.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Organizer Message Composer */}
      {isOrganizer && (
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Type
            </label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="announcement">Announcement</option>
              <option value="location_reveal">Location Reveal</option>
              <option value="update">Event Update</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                messageType === 'location_reveal' 
                  ? 'Reveal the secret location to premium attendees...'
                  : 'Send premium message to attendees...'
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
              maxLength={1000}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <Shield className="h-3 w-3 mr-1" />
                Encrypted & secure delivery
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {newMessage.length}/1000
                </span>
                <button
                  onClick={sendPremiumMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to Premium Members
                </button>
              </div>
            </div>
          </div>

          {messageType === 'location_reveal' && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center text-red-700 text-sm">
                <Eye className="h-4 w-4 mr-2" />
                <strong>Location Reveal Notice</strong>
              </div>
              <p className="text-red-600 text-xs mt-1">
                This will reveal the secret location to all premium attendees. 
                VIP members may have already received early access.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="border-t border-gray-200 p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumMessagePortal;