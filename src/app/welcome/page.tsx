'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/Button';

const CARD_KEYS = [
  {
    titleKey: 'onboarding.welcome.card1.title',
    bodyKey: 'onboarding.welcome.card1.body',
    icon: '📋',
  },
  {
    titleKey: 'onboarding.welcome.card2.title',
    bodyKey: 'onboarding.welcome.card2.body',
    icon: '🤖',
  },
  {
    titleKey: 'onboarding.welcome.card3.title',
    bodyKey: 'onboarding.welcome.card3.body',
    icon: '🎯',
  },
];

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const { t } = useLanguageStore();
  const router = useRouter();

  const isLast = step === CARD_KEYS.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.push('/register');
    } else {
      setStep((s) => s + 1);
    }
  };

  const card = CARD_KEYS[step];

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col p-6">
      {/* Skip button — always visible (PRD §1.E.2) */}
      <div className="flex justify-end">
        <button
          onClick={() => router.push('/register')}
          className="text-gray-400 text-sm font-medium py-2 px-3 hover:text-gray-600"
        >
          {t('onboarding.welcome.skip')}
        </button>
      </div>

      {/* Card content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center">
          <span className="text-5xl">{card.icon}</span>
        </div>

        <div className="space-y-3 max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900">{t(card.titleKey)}</h2>
          <p className="text-gray-600 text-base leading-relaxed">{t(card.bodyKey)}</p>
        </div>
      </div>

      {/* Progress dots + Next button */}
      <div className="space-y-6 pb-4">
        {/* Dots (PRD §1.E.2) */}
        <div className="flex justify-center gap-2">
          {CARD_KEYS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-brand-primary' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button onClick={handleNext} fullWidth>
          {isLast ? t('onboarding.register.title') : t('onboarding.welcome.next')}
        </Button>
      </div>
    </main>
  );
}
