'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { LANGUAGE_OPTIONS } from '@/lib/i18n';
import type { Language } from '@/types';

interface TopBarProps {
  showStreak?: boolean;
  showLanguageSelector?: boolean;
  title?: string;
  backHref?: string;
}

export function TopBar({
  showStreak = false,
  showLanguageSelector = true,
  title,
  backHref,
}: TopBarProps) {
  const { user } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {/* Left: logo or back button */}
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link href={backHref} className="p-1 -ms-1 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <Link href="/home">
              {/* App logo — from ui_assets in DB */}
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">NL</span>
              </div>
            </Link>
          )}
          {title && (
            <h1 className="font-semibold text-gray-900 text-base truncate">{title}</h1>
          )}
        </div>

        {/* Right: streak + language */}
        <div className="flex items-center gap-3">
          {/* Streak counter (PRD §1.D.1) */}
          {showStreak && user && user.streak_days > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
              <span className="text-base">🔥</span>
              <span className="text-orange-600 font-bold text-sm">{user.streak_days}</span>
            </div>
          )}

          {/* Language selector (PRD §1.D.1) */}
          {showLanguageSelector && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="text-sm text-gray-600 bg-transparent border-none cursor-pointer focus:outline-none"
              aria-label="Select language"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.nativeLabel}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </header>
  );
}
