import { nl } from './translations/nl';
import { ar } from './translations/ar';
import { en } from './translations/en';
import { fa } from './translations/fa';
import { tr } from './translations/tr';
import type { Language } from '@/types';

// RTL languages (PRD §12.2)
export const RTL_LANGUAGES: Language[] = ['ar', 'fa'];

export const translations: Record<Language, Record<string, string>> = {
  nl,
  ar,
  en,
  fa,
  tr,
};

// Language display names shown in their own script (PRD §9.4 — no Dutch on language screen)
export const LANGUAGE_OPTIONS: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'nl', label: 'Dutch',   nativeLabel: 'Nederlands' },
  { code: 'ar', label: 'Arabic',  nativeLabel: 'العربية' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fa', label: 'Persian', nativeLabel: 'فارسی' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
];

export function t(key: string, language: Language, vars?: Record<string, string>): string {
  const langMap = translations[language];
  // Fallback chain: requested language → English → key itself
  let text = langMap?.[key] ?? translations['en']?.[key] ?? key;

  // Simple variable interpolation: {{varName}}
  if (vars) {
    Object.entries(vars).forEach(([varKey, value]) => {
      text = text.replace(new RegExp(`{{${varKey}}}`, 'g'), value);
    });
  }

  return text;
}

export function isRTL(language: Language): boolean {
  return RTL_LANGUAGES.includes(language);
}

export function getDir(language: Language): 'rtl' | 'ltr' {
  return isRTL(language) ? 'rtl' : 'ltr';
}
