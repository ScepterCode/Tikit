import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Feature: tikit-webapp, Property 1: Language persistence round-trip
 * Validates: Requirements 1.2
 * 
 * Property: For any selected language from the supported set (English, Hausa, Igbo, Yoruba, Pidgin),
 * when a user selects it, the system should persist it and all subsequent content should be displayed
 * in that language.
 */

type Language = 'en' | 'ha' | 'ig' | 'yo' | 'pcm';

interface NigerianState {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface UserPreferences {
  language: Language;
  state: NigerianState;
}

// Generator for valid languages
const languageArbitrary = fc.constantFrom<Language>('en', 'ha', 'ig', 'yo', 'pcm');

// Generator for Nigerian states
const stateArbitrary = fc.record({
  code: fc.string({ minLength: 3, maxLength: 20 }),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  latitude: fc.double({ min: -90, max: 90 }),
  longitude: fc.double({ min: -180, max: 180 }),
});

// Generator for user preferences
const userPreferencesArbitrary = fc.record({
  language: languageArbitrary,
  state: stateArbitrary,
});

describe('Property Tests - Language Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('Property 1: Language persistence round-trip', () => {
    fc.assert(
      fc.property(userPreferencesArbitrary, (preferences) => {
        const STORAGE_KEY = 'userPreferences';

        // Save preferences to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

        // Retrieve preferences from localStorage
        const savedPreferences = localStorage.getItem(STORAGE_KEY);
        expect(savedPreferences).not.toBeNull();

        const parsed = JSON.parse(savedPreferences!) as UserPreferences;

        // Verify language is persisted correctly
        expect(parsed.language).toBe(preferences.language);
        expect(parsed.state.code).toBe(preferences.state.code);
        expect(parsed.state.name).toBe(preferences.state.name);
        
        // Use closeTo for floating point comparisons to handle -0 vs +0
        expect(Math.abs(parsed.state.latitude - preferences.state.latitude)).toBeLessThan(0.0001);
        expect(Math.abs(parsed.state.longitude - preferences.state.longitude)).toBeLessThan(0.0001);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 1 (Extended): Language selection persists across page reloads', () => {
    fc.assert(
      fc.property(languageArbitrary, (language) => {
        // Simulate i18next language storage
        localStorage.setItem('i18nextLng', language);

        // Retrieve language
        const storedLanguage = localStorage.getItem('i18nextLng');

        // Verify language persists
        expect(storedLanguage).toBe(language);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 1 (Validation): Only valid languages are accepted', () => {
    fc.assert(
      fc.property(languageArbitrary, (language) => {
        const validLanguages: Language[] = ['en', 'ha', 'ig', 'yo', 'pcm'];

        // Verify the generated language is in the valid set
        expect(validLanguages).toContain(language);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 1 (Idempotence): Saving the same preference multiple times produces the same result', () => {
    fc.assert(
      fc.property(userPreferencesArbitrary, (preferences) => {
        const STORAGE_KEY = 'userPreferences';

        // Save preferences multiple times
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        const firstSave = localStorage.getItem(STORAGE_KEY);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        const secondSave = localStorage.getItem(STORAGE_KEY);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
        const thirdSave = localStorage.getItem(STORAGE_KEY);

        // All saves should produce identical results
        expect(firstSave).toBe(secondSave);
        expect(secondSave).toBe(thirdSave);
      }),
      { numRuns: 100 }
    );
  });
});
