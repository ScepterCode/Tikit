import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
  event_id: string;
  user_id: string;
  user_name: string;
  amount: number;
  message?: string;
  updated_at: string;
}

export function useSprayMoneyLeaderboard(eventId: string) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial leaderboard data
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('spray_money_leaderboard')
          .select('*')
          .eq('event_id', eventId)
          .order('amount', { ascending: false });

        if (error) throw error;

        setLeaderboard(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`spray-money-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'spray_money_leaderboard',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newEntry = payload.new as LeaderboardEntry;
            
            setLeaderboard((prev) => {
              // Update existing entry or add new one
              const existingIndex = prev.findIndex(
                (entry) => entry.user_id === newEntry.user_id
              );

              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newEntry;
                return updated.sort((a, b) => b.amount - a.amount);
              } else {
                return [...prev, newEntry].sort((a, b) => b.amount - a.amount);
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedEntry = payload.old as LeaderboardEntry;
            setLeaderboard((prev) =>
              prev.filter((entry) => entry.user_id !== deletedEntry.user_id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return { leaderboard, loading, error };
}
