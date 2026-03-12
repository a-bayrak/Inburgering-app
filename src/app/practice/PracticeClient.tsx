'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { PaywallModal } from '@/components/modals/PaywallModal';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { QuestionCategory } from '@/types';

const MIN_QUESTIONS = 15; // MDC §1.C.4

interface PracticeClientProps {
  categories: QuestionCategory[];
  questionCounts: Record<string, number>;
}

export function PracticeClient({ categories, questionCounts }: PracticeClientProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useLanguageStore();
  const { isPremium } = useAuthStore();
  const router = useRouter();

  const handleSelectCategory = (categoryId: string) => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    const count = questionCounts[categoryId] ?? 0;
    if (count < MIN_QUESTIONS) return; // gated — not enough questions
    router.push(`/practice/${categoryId}`);
  };

  return (
    <div className="page-container">
      <TopBar title={t('practice.title')} showLanguageSelector />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {categories.map((cat) => {
          const count = questionCounts[cat.id] ?? 0;
          const hasEnough = count >= MIN_QUESTIONS;
          const isLocked = !cat.is_active || !hasEnough;

          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              disabled={isLocked}
              className={`w-full card flex items-center gap-4 text-start transition-all active:scale-[0.98] ${
                isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              }`}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-brand-primary font-bold text-sm">{cat.id.split('-')[1]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{cat.name_nl}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {count > 0
                    ? `${count} ${t('practice.questions_available')}`
                    : t('practice.locked')}
                </p>
              </div>
              {!isPremium ? (
                <span className="text-gray-300">🔒</span>
              ) : isLocked ? (
                <span className="text-gray-300 text-xs">Soon</span>
              ) : (
                <span className="text-gray-300">→</span>
              )}
            </button>
          );
        })}
      </main>

      <BottomNav />
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} trigger="section_practice" />
    </div>
  );
}
