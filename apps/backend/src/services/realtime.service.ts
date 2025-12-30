import supabase from '../lib/supabase.js';

/**
 * Real-time service using Supabase Realtime
 */

/**
 * Update event capacity in real-time
 */
export const updateEventCapacity = async (
  eventId: string,
  ticketsSold: number,
  capacity: number
) => {
  const { error } = await supabase.from('event_capacity').upsert(
    {
      event_id: eventId,
      tickets_sold: ticketsSold,
      capacity,
      available: capacity - ticketsSold,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'event_id' }
  );

  if (error) {
    console.error('Error updating event capacity:', error);
    throw error;
  }
};

/**
 * Update group buy status in real-time
 */
export const updateGroupBuyStatus = async (
  groupBuyId: string,
  currentParticipants: number,
  totalParticipants: number,
  participants: Array<{ userId: string; paymentStatus: string }>
) => {
  const { error } = await supabase.from('group_buy_status').upsert(
    {
      group_buy_id: groupBuyId,
      current_participants: currentParticipants,
      total_participants: totalParticipants,
      participants,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'group_buy_id' }
  );

  if (error) {
    console.error('Error updating group buy status:', error);
    throw error;
  }
};

/**
 * Update spray money leaderboard for wedding events
 */
export const updateSprayMoneyLeaderboard = async (
  eventId: string,
  userId: string,
  amount: number,
  userName: string
) => {
  // Get current amount
  const { data: existing } = await supabase
    .from('spray_money_leaderboard')
    .select('amount')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  const currentAmount = existing?.amount || 0;

  const { error } = await supabase.from('spray_money_leaderboard').upsert(
    {
      event_id: eventId,
      user_id: userId,
      user_name: userName,
      amount: currentAmount + amount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'event_id,user_id' }
  );

  if (error) {
    console.error('Error updating spray money leaderboard:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time capacity updates
 */
export const subscribeToCapacityUpdates = (
  eventId: string,
  callback: (data: {
    ticketsSold: number;
    capacity: number;
    available: number;
  } | null) => void
) => {
  const channel = supabase
    .channel(`event-capacity-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_capacity',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        const data = payload.new as {
          tickets_sold: number;
          capacity: number;
          available: number;
        };
        callback({
          ticketsSold: data.tickets_sold,
          capacity: data.capacity,
          available: data.available,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to group buy updates
 */
export const subscribeToGroupBuyUpdates = (
  groupBuyId: string,
  callback: (data: {
    currentParticipants: number;
    totalParticipants: number;
    participants: Array<{ userId: string; paymentStatus: string }>;
  } | null) => void
) => {
  const channel = supabase
    .channel(`group-buy-${groupBuyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_buy_status',
        filter: `group_buy_id=eq.${groupBuyId}`,
      },
      (payload) => {
        const data = payload.new as {
          current_participants: number;
          total_participants: number;
          participants: Array<{ userId: string; paymentStatus: string }>;
        };
        callback({
          currentParticipants: data.current_participants,
          totalParticipants: data.total_participants,
          participants: data.participants,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
