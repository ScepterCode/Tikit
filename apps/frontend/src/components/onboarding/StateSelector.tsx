import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { nigerianStates, NigerianState } from '../../data/nigerianStates';

interface StateSelectorProps {
  onStateSelect: (state: NigerianState) => void;
}

export function StateSelector({ onStateSelect }: StateSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<NigerianState | null>(null);

  const filteredStates = useMemo(() => {
    if (!searchQuery) return nigerianStates;
    
    const query = searchQuery.toLowerCase();
    return nigerianStates.filter((state) =>
      t(`states.${state.code}`).toLowerCase().includes(query) ||
      state.name.toLowerCase().includes(query)
    );
  }, [searchQuery, t]);

  const handleStateClick = (state: NigerianState) => {
    setSelectedState(state);
  };

  const handleContinue = () => {
    if (selectedState) {
      onStateSelect(selectedState);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>{t('onboarding.state.title')}</h1>
        <p style={styles.subtitle}>{t('onboarding.state.subtitle')}</p>

        <input
          type="text"
          placeholder={t('onboarding.state.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.stateList}>
          {filteredStates.map((state) => (
            <button
              key={state.code}
              onClick={() => handleStateClick(state)}
              style={{
                ...styles.stateButton,
                ...(selectedState?.code === state.code ? styles.stateButtonSelected : {}),
              }}
            >
              {t(`states.${state.code}`)}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedState}
          style={{
            ...styles.continueButton,
            ...(selectedState ? {} : styles.continueButtonDisabled),
          }}
        >
          {t('onboarding.state.continue')}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  content: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '12px',
    textAlign: 'center' as const,
    color: '#333',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '24px',
    boxSizing: 'border-box' as const,
  },
  stateList: {
    maxHeight: '400px',
    overflowY: 'auto' as const,
    marginBottom: '24px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  },
  stateButton: {
    width: '100%',
    padding: '16px',
    textAlign: 'left' as const,
    border: 'none',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  },
  stateButtonSelected: {
    backgroundColor: '#f1f8f4',
    fontWeight: '600',
    color: '#4CAF50',
  },
  continueButton: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#4CAF50',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};
