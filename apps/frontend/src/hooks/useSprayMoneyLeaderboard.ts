import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface LeaderboardEntry {
  sprayer_name: string;
  total_amount: number;
  spray_count: number;
  rank: number;
  is_anonymous: boolean;
}

export function useSprayMoneyLeaderboard(eventId: string) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalSprayed, setTotalSprayed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial leaderboard data
    const fetchLeaderboard = async () => {
      try {
        const response = await apiService.request(`/events/${eventId}/spray-money-leaderboard?limit=10`, {
          method: 'GET',
          requireAuth: false
        });
        
        if (response?.data?.success) {
          setLeaderboard(response.data.data.leaderboard || []);
          setTotalSprayed(response.data.data.total_sprayed || 0);
          setError(null);
        } else {
          // Silently handle - set empty data
          console.debug('Leaderboard data not available');
          setLeaderboard([]);
          setTotalSprayed(0);
          setError(null);
        }
      } catch (err: any) {
        // Silently handle errors - don't show to user
        console.debug('Error fetching leaderboard:', err.message);
        setLeaderboard([]);
        setTotalSprayed(0);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Poll for updates every 5 seconds (simulating real-time)
    const interval = setInterval(fetchLeaderboard, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [eventId]);

  return { leaderboard, totalSprayed, loading, error };
}
