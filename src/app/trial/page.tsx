'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/Button';

export default function TrialPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguageStore();
  const router = useRouter();

  const handleStartTrial = async () => {
    setIsLoading(true);
    // Redirect to Stripe checkout for web, or RevenueCat for native
    router.push('/api/stripe/create-checkout?plan=trial');
  };

  const handleSkip = () => {
    router.push('/home');
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center gap-8 max-w-sm mx-auto w-full text-center">
        {/* Icon */}
        <div>
          <div className="w-24 h-24 bg-gradient-to-br from-brand-primary to-blue-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <span className="text-5xl">⭐</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('onboarding.trial.title')}</h1>
        </div>

        {/* Features list */}
        <ul className="text-start space-y-4">
          {[
            { icon: '📝', key: 'paywall.benefit1' },
            { icon: '🤖', key: 'paywall.benefit2' },
            { icon: '📊', key: 'paywall.benefit3' },
            { icon: '🔥', text: 'Streak freeze to protect your progress' },
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="text-2xl w-8 text-center">{item.icon}</span>
              <span className="text-gray-700 font-medium">
                {item.key ? t(item.key) : item.text}
              </span>
            </li>
          ))}
        </ul>

        {/* Price */}
        <div className="card text-center py-5">
          <p className="text-gray-500 text-sm">After free trial</p>
          <p className="text-3xl font-bold text-brand-primary">€9.99</p>
          <p className="text-gray-500 text-sm">/ month · cancel anytime</p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button onClick={handleStartTrial} isLoading={isLoading} fullWidth>
            {t('onboarding.trial.start')}
          </Button>
          {/* PRD §1.E.4: Skip link always visible */}
          <button onClick={handleSkip} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600">
            {t('onboarding.trial.skip')}
          </button>
        </div>
      </div>
    </main>
  );
}
