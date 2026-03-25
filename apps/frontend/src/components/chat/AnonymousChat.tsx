import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Shield, Eye, EyeOff } from 'lucide-react';

interface Message {
  id: string;
  sender_name: string;
  sender_avatar_color: string;
  message: string;
  timestamp: number;
  message_type: string;
}

interface AnonymousIdentity {
  id: string;
  anonymous_name: string;
  avatar_color: string;
}

interface ChatRoom {
  id: string;
  name: string;
  current_participants: number;
  max_participants: number;
  status: string;
}

interface AnonymousChatProps {
  eventId: string;
  roomId?: string;
  onClose?: () => void;
}

const AnonymousChat: React.FC<AnonymousChatProps> = ({ eventId, roomId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [anonymousIdentity, setAnonymousIdentity] = useState<AnonymousIdentity | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (roomId) {
      joinChatRoom(roomId);
    }
  }, [roomId]);

  const joinChatRoom = async (targetRoomId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/anonymous-chat/join-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ room_id: targetRoomId })
      });

      const data = await response.json();

      if (data.success) {
        setChatRoom(data.data.room);
        setAnonymousIdentity(data.data.anonymous_identity);
        setIsJoined(true);
        await loadMessages(targetRoomId);
      } else {
        setError(data.detail || 'Failed to join chat room');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (targetRoomId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/anonymous-chat/messages/${targetRoomId}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId || !isJoined) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/anonymous-chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: roomId,
          message: newMessage.trim(),
          message_type: 'text'
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, data.data.message]);
        setNewMessage('');
      } else {
        setError(data.detail || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Joining anonymous chat...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (!isJoined || !chatRoom || !anonymousIdentity) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Anonymous Chat Available
        </h3>
        <p className="text-gray-600 mb-4">
          Join the secret event chat with complete anonymity. Your identity will be hidden from all participants.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center text-purple-700 text-sm">
            <Eye className="h-4 w-4 mr-2" />
            Premium Feature - Anonymous Identity Protected
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-purple-500 mr-2" />
            <div>
              <h3 className="font-semibold text-gray-900">{chatRoom.name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                {chatRoom.current_participants}/{chatRoom.max_participants} participants
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isAnonymous 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isAnonymous ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {isAnonymous ? 'Anonymous' : 'Visible'}
            </button>
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
        
        {/* Your Anonymous Identity */}
        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
              style={{ backgroundColor: anonymousIdentity.avatar_color }}
            >
              {getAvatarInitials(anonymousIdentity.anonymous_name)}
            </div>
            <div>
              <div className="text-sm font-medium text-purple-900">
                You are: {anonymousIdentity.anonymous_name}
              </div>
              <div className="text-xs text-purple-600">
                Your identity is completely anonymous
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No messages yet. Start the anonymous conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: message.sender_avatar_color }}
              >
                {getAvatarInitials(message.sender_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 text-sm">
                    {message.sender_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mt-1 break-words">
                  {message.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send anonymous message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Messages auto-delete after 24 hours</span>
          <span>{newMessage.length}/500</span>
        </div>
      </div>
    </div>
  );
};

export default AnonymousChat;