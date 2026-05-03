"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { vi } from "@/i18n/vi";
import { en } from "@/i18n/en";
import type { Locale, Dictionary } from "@/i18n";

const dictionaries: Record<Locale, Dictionary> = { vi, en };

interface LanguageContextType {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "vi",
  t: vi,
  setLocale: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof document === "undefined") return "vi";
    const match = document.cookie.match(/locale=(vi|en)/);
    return (match?.[1] as Locale) ?? "vi";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    // Update html lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, t: dictionaries[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  return useContext(LanguageContext).t;
}
