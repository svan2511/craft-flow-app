import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'हिन्दी',
} as const;

export type AppLanguage = keyof typeof SUPPORTED_LANGUAGES;

const LANGUAGE_KEY = 'km.language';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
} as const;

export async function initI18n(): Promise<void> {
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    // ignore storage errors and fall back to device language
  }

  const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
  const lng: AppLanguage = stored === 'en' || stored === 'hi' ? stored : deviceLang === 'hi' ? 'hi' : 'en';

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnEmptyString: false,
  });
}

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // ignore storage errors; in-memory language still applies
  }
}

export function currentLanguage(): AppLanguage {
  return i18n.language === 'hi' ? 'hi' : 'en';
}

export default i18n;