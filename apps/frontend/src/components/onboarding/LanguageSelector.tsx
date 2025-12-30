import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'ha' | 'ig' | 'yo' | 'pcm';

interface LanguageSelectorProps {
  onLanguageSelect: (language: Language) => void;
}

const languages: { code: Language; flag: string }[] = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'ha', flag: '🇳🇬' },
  { code: 'ig', flag: '🇳🇬' },
  { code: 'yo', flag: '🇳🇬' },
  { code: 'pcm', flag: '🇳🇬' },
];

export function LanguageSelector({ onLanguageSelect }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  const handleLanguageClick = (language: Language) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      onLanguageSelect(selectedLanguage);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>{t('onboarding.language.title')}</h1>
        <p style={styles.subtitle}>{t('onboarding.language.subtitle')}</p>

        <div style={styles.languageGrid}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageClick(lang.code)}
              style={{
                ...styles.languageButton,
                ...(selectedLanguage === lang.code ? styles.languageButtonSelected : {}),
              }}
            >
              <span style={styles.flag}>{lang.flag}</span>
              <span style={styles.languageName}>{t(`languages.${lang.code}`)}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedLanguage}
          style={{
            ...styles.continueButton,
            ...(selectedLanguage ? {} : styles.continueButtonDisabled),
          }}
        >
          {t('onboarding.language.continue')}
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
    marginBottom: '32px',
  },
  languageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  languageButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '24px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '16px',
  },
  languageButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  flag: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  languageName: {
    fontWeight: '500',
    color: '#333',
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
