import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Crown, Shield, Users } from 'lucide-react';
import AnonymousChat from '../chat/AnonymousChat';
import PremiumMessagePortal from '../chat/PremiumMessagePortal';

interface SecretEventChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  userRole?: string;
}

const SecretEventChatModal: React.FC<SecretEventChatModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  userRole = 'attendee'
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'messages'>('messages');
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      loadChatRooms();
    }
  }, [isOpen, eventId]);

  const loadChatRooms = async () => {
    setIsLoadingRoom(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/anonymous-chat/rooms/by-event/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.data.rooms.length > 0) {
        setChatRoomId(data.data.rooms[0].room_id);
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const createChatRoom = async () => {
    if (userRole !== 'organizer') return;

    setIsLoadingRoom(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/anonymous-chat/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ event_id: eventId })
      });

      const data = await response.json();
      if (data.success) {
        setChatRoomId(data.data.room_id);
        setActiveTab('chat');
      }
    } catch (err) {
      console.error('Failed to create chat room:', err);
    } finally {
      setIsLoadingRoom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Secret Event Communication
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {eventTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'messages'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Crown className="h-4 w-4 mr-2" />
              Premium Messages
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={!chatRoomId && userRole !== 'organizer'}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Anonymous Chat
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'messages' && (
            <PremiumMessagePortal
              eventId={eventId}
              userRole={userRole}
            />
          )}

          {activeTab === 'chat' && (
            <>
              {!chatRoomId && userRole === 'organizer' && (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Create Anonymous Chat Room
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Enable anonymous chat for your secret event attendees.
                  </p>
                  <button
                    onClick={createChatRoom}
                    disabled={isLoadingRoom}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center mx-auto"
                  >
                    {isLoadingRoom ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Create Chat Room
                  </button>
                </div>
              )}

              {!chatRoomId && userRole !== 'organizer' && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chat Room Not Available
                  </h3>
                  <p className="text-gray-600">
                    The organizer hasn't created an anonymous chat room for this event yet.
                  </p>
                </div>
              )}

              {chatRoomId && (
                <AnonymousChat
                  eventId={eventId}
                  roomId={chatRoomId}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecretEventChatModal;