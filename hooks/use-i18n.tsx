import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import en from '@/assets/i18n/en.json';
import fr from '@/assets/i18n/fr.json';
import ptBR from '@/assets/i18n/pt-BR.json';

export type SupportedLang = 'en' | 'fr' | 'pt-BR';
const RESOURCES = { en, fr, 'pt-BR': ptBR } as const;
const STORAGE_KEY = 'bias-game/lang';

const i18n = new I18n(RESOURCES);
i18n.enableFallback = true;

i18n.defaultLocale = 'en';

function detectDeviceLocale(): SupportedLang {
  const tag = Localization.getLocales()?.[0]?.languageTag || 'en';
  if (tag.startsWith('fr')) return 'fr';
  if (tag.toLowerCase().startsWith('pt')) return 'pt-BR';
  return 'en';
}

export type I18nContextValue = {
  t: (key: string, options?: Record<string, unknown>) => string;
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const initial = (stored as SupportedLang | null) ?? detectDeviceLocale();
        setLangState(initial);
        i18n.locale = initial;
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

  const setLang = (next: SupportedLang) => {
    setLangState(next);
    i18n.locale = next;
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      t: (key, options) => i18n.t(key, options),
      lang,
      setLang,
      ready,
    }),
    [lang, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
