import { useState } from 'react';
import { LanguageSelector, Language } from './LanguageSelector';
import { StateSelector } from './StateSelector';
import { NigerianState } from '../../data/nigerianStates';

type OnboardingStep = 'language' | 'state' | 'complete';

interface OnboardingData {
  language: Language | null;
  state: NigerianState | null;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('language');
  const [data, setData] = useState<OnboardingData>({
    language: null,
    state: null,
  });

  const handleLanguageSelect = (language: Language) => {
    setData((prev) => ({ ...prev, language }));
    setStep('state');
  };

  const handleStateSelect = (state: NigerianState) => {
    const finalData = { ...data, state };
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

  return null;
}
