import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import { EventPreferencesSelector, EventType } from '../components/onboarding/EventPreferencesSelector';

export function PreferencesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handlePreferencesSelect = async (preferences: EventType[]) => {
    setSaving(true);
    
    try {
      // Get Supabase JWT token
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        navigate('/auth/login');
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/users/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_preferences: preferences
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Navigate to appropriate dashboard based on role
        if (user?.role === 'organizer') {
          navigate('/organizer/dashboard');
        } else if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/attendee/dashboard');
        }
      } else {
        alert('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {saving && (
        <div style={styles.savingOverlay}>
          <div style={styles.savingMessage}>Saving preferences...</div>
        </div>
      )}
      <EventPreferencesSelector onPreferencesSelect={handlePreferencesSelect} />
    </div>
  );
}

const styles = {
  savingOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  savingMessage: {
    backgroundColor: '#ffffff',
    padding: '24px 48px',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
};
