'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

// PRD §1.D.7: No pre-ticked boxes. Create Account disabled until required box checked.
export default function GdprPage() {
  const [consents, setConsents] = useState({
    account_data: false,  // required
    ai_features: false,   // optional
    analytics: false,     // optional
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const toggle = (key: keyof typeof consents) => {
    setConsents((c) => ({ ...c, [key]: !c[key] }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const ip = ''; // Server-side would get real IP

      // Insert consent log entries (immutable — INSERT only)
      const consentEntries = Object.entries(consents).map(([type, granted]) => ({
        user_id: user.id,
        consent_type: type,
        granted,
        created_at: now,
      }));

      const { error: logError } = await supabase
        .from('gdpr_consent_log')
        .insert(consentEntries);

      if (logError) throw logError;

      // Update user flags
      const { error: updateError } = await supabase
        .from('users')
        .update({
          ai_consent_granted: consents.ai_features,
          analytics_consent_granted: consents.analytics,
          gdpr_consent_date: now,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/trial');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center gap-6 max-w-sm mx-auto w-full">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">{t('onboarding.gdpr.title')}</h1>
        </div>

        <div className="space-y-4">
          {/* Required consent */}
          <ConsentRow
            checked={consents.account_data}
            onChange={() => toggle('account_data')}
            label={t('onboarding.gdpr.account_data')}
            badge={t('onboarding.gdpr.required')}
            badgeColor="red"
            required
          />

          {/* Optional consents */}
          <ConsentRow
            checked={consents.ai_features}
            onChange={() => toggle('ai_features')}
            label={t('onboarding.gdpr.ai_features')}
            badge={t('onboarding.gdpr.optional')}
            badgeColor="gray"
          />

          <ConsentRow
            checked={consents.analytics}
            onChange={() => toggle('analytics')}
            label={t('onboarding.gdpr.analytics')}
            badge={t('onboarding.gdpr.optional')}
            badgeColor="gray"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Disabled until required checkbox ticked (PRD §1.D.7) */}
        <Button
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={!consents.account_data}
          fullWidth
        >
          {t('onboarding.gdpr.create_account')}
        </Button>

        <a href="/privacy" className="text-xs text-brand-primary text-center hover:underline">
          Privacy Policy
        </a>
      </div>
    </main>
  );
}

function ConsentRow({
  checked, onChange, label, badge, badgeColor, required,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  badge: string;
  badgeColor: 'red' | 'gray';
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer card">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 w-5 h-5 rounded accent-brand-primary shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            badgeColor === 'red'
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {badge}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{label}</p>
      </div>
    </label>
  );
}
