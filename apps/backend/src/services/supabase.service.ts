import { supabase } from '../lib/supabase';

export class SupabaseService {
  // Real-time event capacity updates
  static async updateEventCapacity(eventId: string, ticketsSold: number, capacity: number) {
    if (!supabase) {
      console.warn('Supabase not configured - skipping event capacity update');
      return false;
    }

    try {
      const { error } = await supabase
        .from('event_capacity')
        .upsert({
          event_id: eventId,
          tickets_sold: ticketsSold,
          capacity: capacity,
          available: capacity - ticketsSold,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating event capacity:', error);
        return false;
      }
      
      console.log(`✅ Updated event capacity: ${eventId} (${ticketsSold}/${capacity})`);
      return true;
    } catch (error) {
      console.error('Supabase service error:', error);
      return false;
    }
  }

  // Real-time group buy updates
  static async updateGroupBuyStatus(groupBuyId: string, currentParticipants: number, totalParticipants: number, participants: any[]) {
    if (!supabase) {
      console.warn('Supabase not configured - skipping group buy update');
      return false;
    }

    try {
      const status = currentParticipants >= totalParticipants ? 'completed' : 'active';
      
      const { error } = await supabase
        .from('group_buy_status')
        .upsert({
          group_buy_id: groupBuyId,
          current_participants: currentParticipants,
          total_participants: totalParticipants,
          participants: participants,
          status: status,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating group buy status:', error);
        return false;
      }
      
      console.log(`✅ Updated group buy: ${groupBuyId} (${currentParticipants}/${totalParticipants})`);
      return true;
    } catch (error) {
      console.error('Supabase service error:', error);
      return false;
    }
  }

  // Spray money leaderboard for weddings
  static async updateSprayMoneyLeaderboard(eventId: string, userId: string, userName: string, amount: number) {
    if (!supabase) {
      console.warn('Supabase not configured - skipping spray money update');
      return false;
    }

    try {
      const { error } = await supabase
        .from('spray_money_leaderboard')
        .upsert({
          event_id: eventId,
          user_id: userId,
          user_name: userName,
          amount: amount,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating spray money leaderboard:', error);
        return false;
      }
      
      console.log(`✅ Updated spray money: ${userName} - ₦${amount.toLocaleString()}`);
      return true;
    } catch (error) {
      console.error('Supabase service error:', error);
      return false;
    }
  }

  // Send real-time notification
  static async sendNotification(userId: string, eventId: string | null, type: string, title: string, message: string, data: any = {}) {
    if (!supabase) {
      console.warn('Supabase not configured - skipping notification');
      return false;
    }

    try {
      const { error } = await supabase
        .from('realtime_notifications')
        .insert({
          user_id: userId,
          event_id: eventId,
          type: type,
          title: title,
          message: message,
          data: data
        });

      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }
      
      console.log(`✅ Sent notification to ${userId}: ${title}`);
      return true;
    } catch (error) {
      console.error('Supabase service error:', error);
      return false;
    }
  }

  // Get real-time data
  static async getEventCapacity(eventId: string) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('event_capacity')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) {
        console.error('Error getting event capacity:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Supabase service error:', error);
      return null;
    }
  }

  static async getGroupBuyStatus(groupBuyId: string) {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('group_buy_status')
        .select('*')
        .eq('group_buy_id', groupBuyId)
        .single();

      if (error) {
        console.error('Error getting group buy status:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Supabase service error:', error);
      return null;
    }
  }

  static async getSprayMoneyLeaderboard(eventId: string, limit: number = 10) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('spray_money_leaderboard')
        .select('*')
        .eq('event_id', eventId)
        .order('amount', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting spray money leaderboard:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Supabase service error:', error);
      return [];
    }
  }

  // Subscribe to real-time updates (for frontend)
  static subscribeToEventCapacity(eventId: string, callback: (payload: any) => void) {
    if (!supabase) return null;

    return supabase
      .channel(`event_capacity_${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_capacity',
        filter: `event_id=eq.${eventId}`
      }, callback)
      .subscribe();
  }

  static subscribeToGroupBuyStatus(groupBuyId: string, callback: (payload: any) => void) {
    if (!supabase) return null;

    return supabase
      .channel(`group_buy_${groupBuyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_buy_status',
        filter: `group_buy_id=eq.${groupBuyId}`
      }, callback)
      .subscribe();
  }

  static subscribeToSprayMoneyLeaderboard(eventId: string, callback: (payload: any) => void) {
    if (!supabase) return null;

    return supabase
      .channel(`spray_money_${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'spray_money_leaderboard',
        filter: `event_id=eq.${eventId}`
      }, callback)
      .subscribe();
  }

  static subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    if (!supabase) return null;

    return supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'realtime_notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }

  // Test connection
  static async testConnection() {
    if (!supabase) {
      console.log('❌ Supabase client not configured');
      return false;
    }

    try {
      // Try to query a system table that should always exist
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (error) {
        console.error('❌ Supabase connection test failed:', error.message);
        return false;
      }
      
      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }
  }
}