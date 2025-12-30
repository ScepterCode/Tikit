import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../components/onboarding/LanguageSelector';
import { NigerianState } from '../data/nigerianStates';

export interface UserPreferences {
  language: Language;
  state: NigerianState;
}

const STORAGE_KEY = 'userPreferences';

export function useUserPreferences() {
  const { i18n } = useTranslation();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem(STORAGE_KEY);
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences) as UserPreferences;
        setPreferences(parsed);
        // Apply language to i18n
        i18n.changeLanguage(parsed.language);
      } catch (error) {
        console.error('Failed to parse user preferences:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [i18n]);

  const savePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    // Apply language to i18n
    i18n.changeLanguage(newPreferences.language);
  };

  const clearPreferences = () => {
    setPreferences(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    preferences,
    savePreferences,
    clearPreferences,
    hasCompletedOnboarding: preferences !== null,
  };
}
