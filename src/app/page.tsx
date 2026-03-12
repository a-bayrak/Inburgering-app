'use client';

import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { LANGUAGE_OPTIONS } from '@/lib/i18n';
import type { Language } from '@/types';

// PRD §1.E.1: Language Selection is the FIRST screen.
// No Dutch text anywhere on this screen.
// Shows all 5 languages in their own native scripts.
export default function LanguageSelectionPage() {
  const { language, setLanguage } = useLanguageStore();
  const router = useRouter();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    router.push('/welcome');
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 gap-8">
      {/* App icon */}
      <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-2xl">NL</span>
      </div>

      {/* Language options — no Dutch text (PRD §1.E.1) */}
      <div className="w-full max-w-sm space-y-3">
        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => handleSelect(opt.code)}
            className={`
              w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all
              ${language === opt.code
                ? 'border-brand-primary bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFlag(opt.code)}</span>
              <span className="font-semibold text-gray-900 text-lg">{opt.nativeLabel}</span>
            </div>
            {language === opt.code && (
              <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </main>
  );
}

function getFlag(code: Language): string {
  const flags: Record<Language, string> = {
    nl: '🇳🇱', ar: '🇸🇦', en: '🇬🇧', fa: '🇮🇷', tr: '🇹🇷',
  };
  return flags[code] ?? '🌍';
}
