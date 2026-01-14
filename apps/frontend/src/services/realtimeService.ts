/*
Real-time Service
WebSocket connection to FastAPI backend with fallback to Supabase realtime
*/

import { supabase } from '../lib/supabase';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

interface ConnectionConfig {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private connectionId: string | null = null;
  private token: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private autoReconnect = true;
  private messageHandlers: Map<string, Function[]> = new Map();
  private subscriptions: Map<string, any> = new Map();

  constructor(config: ConnectionConfig = {}) {
    this.autoReconnect = config.autoReconnect ?? true;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
    this.reconnectInterval = config.reconnectInterval ?? 3000;
  }

  /**
   * Connect to FastAPI WebSocket
   */
  async connect(token?: string): Promise<boolean> {
    try {
      // Get auth token if not provided
      if (!token && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }

      this.token = token || null;
      this.connectionId = this.generateConnectionId();

      const wsUrl = this.buildWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket not initialized'));
          return;
        }

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.setupHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.handleDisconnection();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      });

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      return false;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.autoReconnect = false;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.connectionId = null;
    this.token = null;
  }

  /**
   * Send message to WebSocket
   */
  send(message: WebSocketMessage): boolean {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    try {
      this.ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Subscribe to event updates
   */
  subscribeToEvent(eventId: string) {
    // Try WebSocket first
    if (this.isConnected) {
      this.send({
        type: 'subscribe_event',
        data: { event_id: eventId }
      });
    }

    // Also subscribe via Supabase as fallback
    if (supabase) {
      const channel = supabase
        .channel(`event_${eventId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        }, (payload) => {
          this.emit('event_update', {
            eventId,
            type: 'database_change',
            data: payload
          });
        })
        .subscribe();

      this.subscriptions.set(`event_${eventId}`, channel);
    }
  }

  /**
   * Unsubscribe from event updates
   */
  unsubscribeFromEvent(eventId: string) {
    // Unsubscribe from WebSocket
    if (this.isConnected) {
      this.send({
        type: 'unsubscribe_event',
        data: { event_id: eventId }
      });
    }

    // Unsubscribe from Supabase
    const channel = this.subscriptions.get(`event_${eventId}`);
    if (channel && supabase) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(`event_${eventId}`);
    }
  }

  /**
   * Join a room for group messaging
   */
  joinRoom(roomId: string) {
    this.send({
      type: 'join_room',
      data: { room_id: roomId }
    });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string) {
    this.send({
      type: 'leave_room',
      data: { room_id: roomId }
    });
  }

  /**
   * Send message to room
   */
  sendRoomMessage(roomId: string, content: string) {
    this.send({
      type: 'send_message',
      data: {
        target_type: 'room',
        target_id: roomId,
        content
      }
    });
  }

  /**
   * Send direct message to user
   */
  sendDirectMessage(userId: string, content: string) {
    this.send({
      type: 'send_message',
      data: {
        target_type: 'user',
        target_id: userId,
        content
      }
    });
  }

  /**
   * Add event listener
   */
  on(eventType: string, handler: Function) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, handler: Function) {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, data: any) {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      // Emit specific event types
      this.emit(message.type, message);
      
      // Emit general message event
      this.emit('message', message);

      // Handle specific message types
      switch (message.type) {
        case 'connection_established':
          this.emit('connected', message);
          break;
        
        case 'event_update':
          this.emit('event_update', message);
          break;
        
        case 'notification':
          this.emit('notification', message.data);
          break;
        
        case 'room_message':
          this.emit('room_message', message);
          break;
        
        case 'personal_message':
          this.emit('personal_message', message);
          break;
        
        case 'broadcast':
          this.emit('broadcast', message);
          break;
        
        case 'pong':
          // Heartbeat response
          break;
        
        default:
          console.log('Unknown message type:', message.type);
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection() {
    this.isConnected = false;
    this.emit('disconnected', {});

    if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(this.token || undefined);
      }, this.reconnectInterval);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', {});
    }
  }

  /**
   * Setup heartbeat to keep connection alive
   */
  private setupHeartbeat() {
    const heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build WebSocket URL
   */
  private buildWebSocketUrl(): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    
    let url = `${wsUrl}/api/realtime/ws/${this.connectionId}`;
    
    if (this.token) {
      url += `?token=${this.token}`;
    }
    
    return url;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connectionId: this.connectionId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService();

// Export for use in components
export default realtimeService;