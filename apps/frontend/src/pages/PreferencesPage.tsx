import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import { EventPreferencesSelector, EventType } from '../components/onboarding/EventPreferencesSelector';
import { Mail } from 'lucide-react';

export function PreferencesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showEmailBanner, setShowEmailBanner] = useState(false);

  useEffect(() => {
    // Show email verification banner if user has email but not verified
    if (user?.email && !user?.email_verified) {
      setShowEmailBanner(true);
    }
  }, [user]);

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
      {/* Email Verification Banner */}
      {showEmailBanner && (
        <div style={styles.emailBanner}>
          <div style={styles.emailBannerContent}>
            <Mail style={styles.emailIcon} />
            <div style={styles.emailBannerText}>
              <strong>Verify your email</strong>
              <p style={styles.emailBannerSubtext}>
                We've sent a verification link to {user?.email}. Please check your inbox.
              </p>
            </div>
            <button 
              onClick={() => setShowEmailBanner(false)}
              style={styles.emailBannerClose}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
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
  emailBanner: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#dbeafe',
    borderBottom: '2px solid #3b82f6',
    padding: '16px',
    zIndex: 1000,
  },
  emailBannerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  emailIcon: {
    width: '24px',
    height: '24px',
    color: '#3b82f6',
    flexShrink: 0,
  },
  emailBannerText: {
    flex: 1,
    color: '#1e40af',
  },
  emailBannerSubtext: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#3b82f6',
  },
  emailBannerClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#3b82f6',
    cursor: 'pointer',
    padding: '4px 8px',
  },
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
