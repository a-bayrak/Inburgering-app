'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { PaywallModal } from '@/components/modals/PaywallModal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { User, UserAnalytics } from '@/types';

interface HomeClientProps {
  user: User;
  analytics: UserAnalytics | null;
}

export function HomeClient({ user, analytics }: HomeClientProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { t } = useLanguageStore();
  const { setUser, isPremium } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setUser(user);
  }, [user]);

  // First-visit tooltip (PRD §1.E.5) — auto-dismiss after 5s
  useEffect(() => {
    const seen = localStorage.getItem('home_tooltip_seen');
    if (!seen && !analytics?.total_exams_completed) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem('home_tooltip_seen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem('home_tooltip_seen', 'true');
  };

  const handleStartExam = () => {
    // Free users: only 1 exam allowed (PRD §7.1)
    const examsDone = analytics?.total_exams_completed ?? 0;
    if (!isPremium && examsDone >= 1) {
      setShowPaywall(true);
      return;
    }
    router.push('/exam/start');
  };

  const handleSectionPractice = () => {
    const sectionsDone = analytics?.total_sections_completed ?? 0;
    if (!isPremium && sectionsDone >= 1) {
      setShowPaywall(true);
      return;
    }
    router.push('/practice');
  };

  const handleAiPartner = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    router.push('/ai-partner');
  };

  const hasData = (analytics?.total_exams_completed ?? 0) > 0;
  const avgGrade = analytics?.avg_grade ?? 0;
  const gradeColor = avgGrade >= 6 ? 'green' : avgGrade >= 4 ? 'orange' : 'red';

  return (
    <div className="page-container">
      <TopBar showStreak showLanguageSelector />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Hero zone (PRD §1.D.1) */}
        {hasData ? (
          <section className="card flex items-center gap-5">
            {/* Progress ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#E5E7EB" strokeWidth="8"/>
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={avgGrade >= 6 ? '#4CAF50' : avgGrade >= 4 ? '#F5A623' : '#E53E3E'}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - (avgGrade / 10))}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{avgGrade.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400">avg</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-sm">
                {t('home.greeting')}{user.display_name ? `, ${user.display_name}` : ''}
              </p>
              <p className="font-bold text-gray-900 text-lg">
                {analytics?.total_exams_completed} {t('home.progress.exams_completed')}
              </p>
              <p className="text-sm text-gray-500">
                {analytics?.exams_passed ?? 0} passed · {t('home.progress.avg_grade')}: {avgGrade.toFixed(1)}
              </p>

              {/* Readiness bar */}
              <div className="mt-3">
                <ProgressBar value={avgGrade * 10} color={gradeColor} height="thin" />
              </div>
            </div>
          </section>
        ) : (
          /* Empty state (PRD §1.D.2) */
          <section className="card text-center py-8 space-y-3">
            <div className="text-5xl">👋</div>
            <p className="font-bold text-gray-900 text-lg">{t('home.empty_state')}</p>
            <p className="text-gray-500 text-sm">
              Start your first practice exam to see your progress here.
            </p>
          </section>
        )}

        {/* Upgrade banner for free users */}
        {!isPremium && (
          <button
            onClick={() => setShowPaywall(true)}
            className="w-full bg-gradient-to-r from-brand-primary to-blue-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-md"
          >
            <span className="font-semibold text-sm">{t('home.upgrade.banner')}</span>
            <span className="text-lg">→</span>
          </button>
        )}

        {/* Quick action cards (PRD §1.D.1) */}
        <section className="space-y-3">

          {/* Full Exam card */}
          <div className="relative">
            <ActionCard
              icon="📝"
              title={t('home.start_exam')}
              subtitle="40 questions · 45 minutes"
              color="primary"
              onClick={handleStartExam}
            />
            {/* Tooltip (PRD §1.E.5) */}
            {showTooltip && (
              <div
                onClick={dismissTooltip}
                className="absolute -top-12 left-4 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 cursor-pointer"
              >
                👆 Tap here to start your first exam
                <div className="absolute top-full left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900" />
              </div>
            )}
          </div>

          {/* Section Practice card */}
          <ActionCard
            icon="📚"
            title={t('home.section_practice')}
            subtitle="Practice by topic"
            color="secondary"
            onClick={handleSectionPractice}
            locked={!isPremium}
          />

          {/* AI Partner card — Phase 1.1, shown but locked for now */}
          <ActionCard
            icon="🤖"
            title={t('home.ai_partner')}
            subtitle="Premium · Phase 1.1"
            color="ghost"
            onClick={handleAiPartner}
            locked={!isPremium}
            comingSoon={!isPremium}
          />
        </section>

        {/* Streak widget */}
        {user.streak_days > 0 && (
          <section className="card flex items-center gap-4">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-bold text-gray-900">
                {user.streak_days} {t('home.streak')}
              </p>
              <p className="text-xs text-gray-400">Keep it up!</p>
            </div>
          </section>
        )}
      </main>

      <BottomNav />

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="home"
      />
    </div>
  );
}

function ActionCard({
  icon, title, subtitle, color, onClick, locked, comingSoon,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
  locked?: boolean;
  comingSoon?: boolean;
}) {
  const colorMap = {
    primary: 'bg-brand-primary text-white',
    secondary: 'bg-blue-50 text-brand-primary',
    ghost: 'bg-gray-50 text-gray-600',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full card flex items-center gap-4 text-start active:scale-[0.98] transition-transform ${
        locked ? 'opacity-75' : ''
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-base">{title}</p>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>
      {locked ? (
        <span className="text-gray-300 text-xl">🔒</span>
      ) : (
        <span className="text-gray-300 text-xl">→</span>
      )}
    </button>
  );
}
