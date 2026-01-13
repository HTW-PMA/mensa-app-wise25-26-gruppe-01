import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { storage } from '@/utils/storage';
import {
  SupportedLocale,
  getDeviceLocale,
  getLocale,
  setLocale,
} from '@/utils/i18n';

type LanguageContextType = {
  locale: SupportedLocale;
  isLoading: boolean;
  setLanguage: (locale: SupportedLocale) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const STORAGE_KEY = 'language';

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getLocale());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLanguage = async () => {
      const saved = await storage.get<string>(STORAGE_KEY);
      const resolved = (saved as SupportedLocale) ?? getDeviceLocale();
      setLocale(resolved);
      if (isMounted) {
        setLocaleState(resolved);
        setIsLoading(false);
      }
    };

    loadLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = async (nextLocale: SupportedLocale) => {
    setLocale(nextLocale);
    setLocaleState(nextLocale);
    await storage.save(STORAGE_KEY, nextLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, isLoading, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
