import { useState } from 'react';
import { LanguageSelector, Language } from './LanguageSelector';
import { StateSelector } from './StateSelector';
import { EventPreferencesSelector, EventType } from './EventPreferencesSelector';
import { NigerianState } from '../../data/nigerianStates';

type OnboardingStep = 'language' | 'state' | 'preferences' | 'complete';

interface OnboardingData {
  language: Language | null;
  state: NigerianState | null;
  eventPreferences: EventType[];
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('language');
  const [data, setData] = useState<OnboardingData>({
    language: null,
    state: null,
    eventPreferences: [],
  });

  const handleLanguageSelect = (language: Language) => {
    setData((prev) => ({ ...prev, language }));
    setStep('state');
  };

  const handleStateSelect = (state: NigerianState) => {
    setData((prev) => ({ ...prev, state }));
    setStep('preferences');
  };

  const handlePreferencesSelect = (eventPreferences: EventType[]) => {
    const finalData = { ...data, eventPreferences };
    setData(finalData);
    setStep('complete');
    onComplete(finalData);
  };

  if (step === 'language') {
    return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
  }

  if (step === 'state') {
    return <StateSelector onStateSelect={handleStateSelect} />;
  }

  if (step === 'preferences') {
    return <EventPreferencesSelector onPreferencesSelect={handlePreferencesSelect} />;
  }

  return null;
}
