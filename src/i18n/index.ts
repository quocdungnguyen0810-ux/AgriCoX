import { vi, type Dictionary } from "./vi";
import { en } from "./en";

export type Locale = "vi" | "en";

const dictionaries: Record<Locale, Dictionary> = { vi, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.vi;
}

export function getLocaleFromCookie(cookieHeader?: string): Locale {
  if (!cookieHeader) return "vi";
  const match = cookieHeader.match(/locale=(vi|en)/);
  return (match?.[1] as Locale) || "vi";
}

export { type Dictionary };
