/*
Real-time Connection Hook
React hook for managing WebSocket connections to FastAPI backend
*/

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/FastAPIAuthContext';
import realtimeService from '../services/realtimeService';

interface UseRealtimeConnectionOptions {
  autoConnect?: boolean;
  reconnectOnAuth?: boolean;
}

interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connectionId: string | null;
  reconnectAttempts: number;
}

export function useRealtimeConnection(options: UseRealtimeConnectionOptions = {}) {
  const { autoConnect = true, reconnectOnAuth = true } = options;
  const { user, session } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    connectionId: null,
    reconnectAttempts: 0
  });

  const connectionAttempted = useRef(false);

  // Update connection state from realtime service
  const updateConnectionState = useCallback(() => {
    const status = realtimeService.getStatus();
    setConnectionState(prev => ({
      ...prev,
      connected: status.connected,
      connectionId: status.connectionId,
      reconnectAttempts: status.reconnectAttempts
    }));
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (connectionState.connecting || connectionState.connected) {
      return;
    }

    setConnectionState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const success = await realtimeService.connect(session?.access_token);
      
      if (success) {
        updateConnectionState();
        setConnectionState(prev => ({ ...prev, connecting: false, error: null }));
      } else {
        setConnectionState(prev => ({
          ...prev,
          connecting: false,
          error: 'Failed to connect to real-time service'
        }));
      }
    } catch (error: any) {
      setConnectionState(prev => ({
        ...prev,
        connecting: false,
        error: error.message || 'Connection failed'
      }));
    }
  }, [connectionState.connecting, connectionState.connected, session?.access_token, updateConnectionState]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    realtimeService.disconnect();
    setConnectionState({
      connected: false,
      connecting: false,
      error: null,
      connectionId: null,
      reconnectAttempts: 0
    });
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleConnected = () => {
      updateConnectionState();
      setConnectionState(prev => ({ ...prev, connecting: false, error: null }));
    };

    const handleDisconnected = () => {
      updateConnectionState();
    };

    const handleMaxReconnectAttempts = () => {
      setConnectionState(prev => ({
        ...prev,
        error: 'Maximum reconnection attempts reached'
      }));
    };

    // Add event listeners
    realtimeService.on('connected', handleConnected);
    realtimeService.on('disconnected', handleDisconnected);
    realtimeService.on('max_reconnect_attempts', handleMaxReconnectAttempts);

    return () => {
      // Remove event listeners
      realtimeService.off('connected', handleConnected);
      realtimeService.off('disconnected', handleDisconnected);
      realtimeService.off('max_reconnect_attempts', handleMaxReconnectAttempts);
    };
  }, [updateConnectionState]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (autoConnect && user && session && !connectionAttempted.current) {
      connectionAttempted.current = true;
      connect();
    } else if (!user && connectionState.connected) {
      disconnect();
      connectionAttempted.current = false;
    }
  }, [user, session, autoConnect, connect, disconnect, connectionState.connected]);

  // Reconnect when auth state changes
  useEffect(() => {
    if (reconnectOnAuth && user && session && connectionState.connected) {
      // Reconnect with new token
      disconnect();
      setTimeout(() => connect(), 1000);
    }
  }, [user, session, reconnectOnAuth, connect, disconnect, connectionState.connected]);

  return {
    ...connectionState,
    connect,
    disconnect,
    retry: connect
  };
}

// Hook for subscribing to specific events
export function useEventSubscription(eventId: string | null) {
  const { connected } = useRealtimeConnection();
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (connected && eventId && !subscribed) {
      realtimeService.subscribeToEvent(eventId);
      setSubscribed(true);
    }

    return () => {
      if (eventId && subscribed) {
        realtimeService.unsubscribeFromEvent(eventId);
        setSubscribed(false);
      }
    };
  }, [connected, eventId, subscribed]);

  return { subscribed };
}

// Hook for listening to real-time messages
export function useRealtimeMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      setLastMessage(message);
      setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
    };

    const handleEventUpdate = (update: any) => {
      setLastMessage({ type: 'event_update', ...update });
    };

    const handleNotification = (notification: any) => {
      setLastMessage({ type: 'notification', ...notification });
    };

    const handleBroadcast = (broadcast: any) => {
      setLastMessage({ type: 'broadcast', ...broadcast });
    };

    // Add event listeners
    realtimeService.on('message', handleMessage);
    realtimeService.on('event_update', handleEventUpdate);
    realtimeService.on('notification', handleNotification);
    realtimeService.on('broadcast', handleBroadcast);

    return () => {
      // Remove event listeners
      realtimeService.off('message', handleMessage);
      realtimeService.off('event_update', handleEventUpdate);
      realtimeService.off('notification', handleNotification);
      realtimeService.off('broadcast', handleBroadcast);
    };
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);

  return {
    messages,
    lastMessage,
    clearMessages
  };
}