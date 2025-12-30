import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Hook for real-time event capacity updates
export function useEventCapacity(eventId: string) {
  const [capacity, setCapacity] = useState<{
    tickets_sold: number;
    capacity: number;
    available: number;
    updated_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !eventId) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    const fetchCapacity = async () => {
      try {
        const { data, error } = await supabase
          .from('event_capacity')
          .select('*')
          .eq('event_id', eventId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          setError(error.message);
        } else {
          setCapacity(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCapacity();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`event_capacity_${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_capacity',
        filter: `event_id=eq.${eventId}`
      }, (payload) => {
        console.log('Event capacity update:', payload);
        if (payload.new) {
          setCapacity(payload.new as any);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { capacity, loading, error };
}

// Hook for real-time group buy status
export function useGroupBuyStatus(groupBuyId: string) {
  const [groupBuy, setGroupBuy] = useState<{
    current_participants: number;
    total_participants: number;
    participants: any[];
    status: string;
    updated_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !groupBuyId) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    const fetchGroupBuy = async () => {
      try {
        const { data, error } = await supabase
          .from('group_buy_status')
          .select('*')
          .eq('group_buy_id', groupBuyId)
          .single();

        if (error && error.code !== 'PGRST116') {
          setError(error.message);
        } else {
          setGroupBuy(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupBuy();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`group_buy_${groupBuyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_buy_status',
        filter: `group_buy_id=eq.${groupBuyId}`
      }, (payload) => {
        console.log('Group buy update:', payload);
        if (payload.new) {
          setGroupBuy(payload.new as any);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupBuyId]);

  return { groupBuy, loading, error };
}

// Hook for spray money leaderboard
export function useSprayMoneyLeaderboard(eventId: string) {
  const [leaderboard, setLeaderboard] = useState<Array<{
    user_id: string;
    user_name: string;
    amount: number;
    updated_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !eventId) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('spray_money_leaderboard')
          .select('*')
          .eq('event_id', eventId)
          .order('amount', { ascending: false })
          .limit(10);

        if (error) {
          setError(error.message);
        } else {
          setLeaderboard(data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`spray_money_${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'spray_money_leaderboard',
        filter: `event_id=eq.${eventId}`
      }, (payload) => {
        console.log('Spray money update:', payload);
        // Refresh the leaderboard when there's an update
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { leaderboard, loading, error };
}

// Hook for real-time notifications
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    read: boolean;
    created_at: string;
  }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('realtime_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching notifications:', error);
        } else {
          setNotifications(data || []);
          setUnreadCount((data || []).filter(n => !n.read).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'realtime_notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('New notification:', payload);
        if (payload.new) {
          setNotifications(prev => [payload.new as any, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('realtime_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!supabase || !userId) return;

    try {
      const { error } = await supabase
        .from('realtime_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [userId]);

  return { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  };
}