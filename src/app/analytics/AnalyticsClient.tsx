'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PaywallModal } from '@/components/modals/PaywallModal';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { UserAnalytics, User } from '@/types';

const KNM_CATEGORIES = [
  { id: 'KNM-01', label: 'Werk en inkomen' },
  { id: 'KNM-02', label: 'Omgangsvormen' },
  { id: 'KNM-03', label: 'Wonen in Nederland' },
  { id: 'KNM-04', label: 'Gezondheid' },
  { id: 'KNM-05', label: 'Geschiedenis en geografie' },
  { id: 'KNM-06', label: 'Instanties' },
  { id: 'KNM-07', label: 'Staatsinrichting' },
  { id: 'KNM-08', label: 'Onderwijs' },
];

export function AnalyticsClient({
  analytics, isPremium, user,
}: { analytics: UserAnalytics | null; isPremium: boolean; user: User }) {
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useLanguageStore();

  const hasData = (analytics?.total_exams_completed ?? 0) > 0;

  if (!hasData) {
    return (
      <div className="page-container">
        <TopBar title={t('analytics.title')} showLanguageSelector />
        <main className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
          <div className="text-5xl">📊</div>
          <p className="font-bold text-gray-900">{t('analytics.no_data')}</p>
          <a href="/exam/start" className="text-brand-primary text-sm hover:underline">
            Start your first exam →
          </a>
        </main>
        <BottomNav />
      </div>
    );
  }

  const studyHours = Math.round((analytics?.total_study_time_sec ?? 0) / 3600 * 10) / 10;

  return (
    <div className="page-container">
      <TopBar title={t('analytics.title')} showLanguageSelector />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Summary stats */}
        <section className="grid grid-cols-2 gap-3">
          {[
            { icon: '📝', value: analytics?.total_exams_completed, label: t('analytics.exams_completed') },
            { icon: '🏆', value: analytics?.best_grade?.toFixed(1), label: t('analytics.best_grade') },
            { icon: '📈', value: analytics?.avg_grade?.toFixed(1), label: t('analytics.avg_grade') },
            { icon: '✅', value: analytics?.exams_passed, label: t('analytics.passed') },
          ].map((stat, i) => (
            <div key={i} className="card text-center py-4">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-2xl font-black text-brand-primary mt-1">{stat.value ?? '–'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Study time */}
        <section className="card flex items-center gap-4">
          <span className="text-3xl">⏱</span>
          <div>
            <p className="font-bold text-gray-900">{studyHours}h {t('analytics.study_time')}</p>
            <p className="text-xs text-gray-400">across all sessions</p>
          </div>
        </section>

        {/* Category accuracy — premium full, free blurred (PRD §7.1) */}
        <section className={`card space-y-4 relative ${!isPremium ? 'overflow-hidden' : ''}`}>
          {!isPremium && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-2xl
                            flex flex-col items-center justify-center gap-3">
              <p className="font-bold text-gray-900">🔒 Premium Analytics</p>
              <button onClick={() => setShowPaywall(true)}
                className="text-brand-primary text-sm font-semibold hover:underline">
                {t('analytics.premium_prompt')}
              </button>
            </div>
          )}

          <h3 className="font-bold text-gray-900">{t('analytics.category_accuracy')}</h3>
          {KNM_CATEGORIES.map((cat) => {
            const score = analytics?.category_accuracy?.[cat.id];
            const pct = score ? Math.round((score.correct / score.total) * 100) : 0;
            const color = pct >= 65 ? 'green' : pct >= 40 ? 'orange' : 'red';
            return (
              <div key={cat.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{cat.label}</span>
                  <span className="text-gray-500 font-medium">{score ? `${pct}%` : '–'}</span>
                </div>
                <ProgressBar value={pct} color={color} height="thin" />
              </div>
            );
          })}
        </section>
      </main>

      <BottomNav />
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} trigger="analytics" />
    </div>
  );
}
