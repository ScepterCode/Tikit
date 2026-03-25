import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type EventType = 
  | 'weddings'
  | 'concerts'
  | 'festivals'
  | 'conferences'
  | 'parties'
  | 'sports'
  | 'comedy'
  | 'theater'
  | 'workshops'
  | 'networking'
  | 'religious'
  | 'other';

interface EventPreference {
  id: EventType;
  label: string;
  icon: string;
  description: string;
}

const eventPreferences: EventPreference[] = [
  { id: 'weddings', label: 'Weddings', icon: '💒', description: 'Wedding ceremonies and receptions' },
  { id: 'concerts', label: 'Concerts', icon: '🎵', description: 'Live music performances' },
  { id: 'festivals', label: 'Festivals', icon: '🎉', description: 'Cultural and music festivals' },
  { id: 'conferences', label: 'Conferences', icon: '🎤', description: 'Professional conferences and seminars' },
  { id: 'parties', label: 'Parties', icon: '🎊', description: 'Social gatherings and celebrations' },
  { id: 'sports', label: 'Sports', icon: '⚽', description: 'Sporting events and competitions' },
  { id: 'comedy', label: 'Comedy', icon: '😂', description: 'Stand-up comedy and humor shows' },
  { id: 'theater', label: 'Theater', icon: '🎭', description: 'Plays and theatrical performances' },
  { id: 'workshops', label: 'Workshops', icon: '🛠️', description: 'Educational workshops and training' },
  { id: 'networking', label: 'Networking', icon: '🤝', description: 'Professional networking events' },
  { id: 'religious', label: 'Religious', icon: '🙏', description: 'Religious gatherings and crusades' },
  { id: 'other', label: 'Other', icon: '✨', description: 'Other types of events' },
];

interface EventPreferencesSelectorProps {
  onPreferencesSelect: (preferences: EventType[]) => void;
}

export function EventPreferencesSelector({ onPreferencesSelect }: EventPreferencesSelectorProps) {
  const { t } = useTranslation();
  const [selectedPreferences, setSelectedPreferences] = useState<EventType[]>([]);

  const togglePreference = (preferenceId: EventType) => {
    setSelectedPreferences((prev) => {
      if (prev.includes(preferenceId)) {
        return prev.filter((id) => id !== preferenceId);
      } else {
        return [...prev, preferenceId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedPreferences.length > 0) {
      onPreferencesSelect(selectedPreferences);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>What events interest you?</h1>
        <p style={styles.subtitle}>
          Select at least 3 event types to personalize your experience. We'll show you events that match your interests.
        </p>

        <div style={styles.preferencesGrid}>
          {eventPreferences.map((preference) => (
            <button
              key={preference.id}
              style={{
                ...styles.preferenceCard,
                ...(selectedPreferences.includes(preference.id) ? styles.preferenceCardSelected : {}),
              }}
              onClick={() => togglePreference(preference.id)}
            >
              <div style={styles.preferenceIcon}>{preference.icon}</div>
              <div style={styles.preferenceLabel}>{preference.label}</div>
              <div style={styles.preferenceDescription}>{preference.description}</div>
              {selectedPreferences.includes(preference.id) && (
                <div style={styles.checkmark}>✓</div>
              )}
            </button>
          ))}
        </div>

        <div style={styles.footer}>
          <div style={styles.selectedCount}>
            {selectedPreferences.length} selected
            {selectedPreferences.length < 3 && (
              <span style={styles.minText}> (select at least 3)</span>
            )}
          </div>
          <button
            style={{
              ...styles.continueButton,
              ...(selectedPreferences.length < 3 ? styles.continueButtonDisabled : {}),
            }}
            onClick={handleContinue}
            disabled={selectedPreferences.length < 3}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '20px',
  },
  content: {
    maxWidth: '900px',
    width: '100%',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center' as const,
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    textAlign: 'center' as const,
    marginBottom: '40px',
    lineHeight: '1.5',
  },
  preferencesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  preferenceCard: {
    position: 'relative' as const,
    padding: '24px',
    backgroundColor: '#ffffff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  preferenceCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f5f7ff',
    transform: 'scale(1.02)',
  },
  preferenceIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  preferenceLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  preferenceDescription: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4',
  },
  checkmark: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  selectedCount: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  minText: {
    color: '#6b7280',
    fontWeight: 'normal',
  },
  continueButton: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
};
