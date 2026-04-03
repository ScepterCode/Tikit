import { useState, useEffect, useCallback } from 'react';
import { apiService as api } from '../services/api';

interface SecretEvent {
  id: string;
  event_id: string;
  title?: string;
  teaser_description?: string;
  category?: string;
  vibe?: string;
  current_location: string;
  location_stage: string;
  location_revealed: boolean;
  countdown_seconds: number;
  vip_early_access?: boolean;
  premium_tier_required: string;
  current_attendees?: number;
  max_attendees?: number;
  attendee_list_hidden?: boolean;
  location_reveal_time: string;
}

interface UseSecretEventsReturn {
  events: SecretEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  validateInviteCode: (code: string) => Promise<any>;
  requestInvite: (eventId: string, message: string) => Promise<void>;
}

export function useSecretEvents(): UseSecretEventsReturn {
  const [events, setEvents] = useState<SecretEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/secret-events/accessible');
      
      if (response.data.success) {
        setEvents(response.data.data.events);
      } else {
        setError(response.data.error || 'Failed to load secret events');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Please log in to view secret events');
      } else {
        setError(err.response?.data?.detail || 'Failed to load secret events');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const validateInviteCode = async (code: string) => {
    try {
      const response = await api.post('/secret-events/validate-invite', {
        invite_code: code
      });
      
      if (response.data.success) {
        // Refresh events list
        await fetchEvents();
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Invalid invite code');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to validate invite code');
    }
  };

  const requestInvite = async (eventId: string, message: string) => {
    try {
      const response = await api.post('/secret-events/request-invite', {
        secret_event_id: eventId,
        message
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send invite request');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to send invite request');
    }
  };

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    validateInviteCode,
    requestInvite
  };
}

export default useSecretEvents;
