'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { PaywallModal } from '@/components/modals/PaywallModal';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useExamStore } from '@/store/useExamStore';
import type { ExamSession, AiExamReportResponse } from '@/types';

interface ResultsClientProps {
  session: ExamSession;
  isPremium: boolean;
}

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

export function ResultsClient({ session, isPremium }: ResultsClientProps) {
  const [aiReport, setAiReport] = useState<AiExamReportResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useLanguageStore();
  const { resetExam } = useExamStore();
  const router = useRouter();

  const grade = session.grade ?? 0;
  const passed = session.passed ?? false;
  const scoreRaw = session.score_raw ?? 0;
  const scorePct = session.score_pct ?? 0;
  const gradeColor = passed ? 'text-green-600' : 'text-red-600';

  const handleViewAiReport = async () => {
    if (!isPremium) { setShowPaywall(true); return; }
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/exam-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id }),
      });
      const data = await res.json();
      setAiReport(data);
    } catch {
      // silently fail — show static results only
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleTryAgain = () => {
    resetExam();
    router.push('/exam/start');
  };

  return (
    <div className="page-container">
      <TopBar title={t('results.title')} backHref="/home" showLanguageSelector={false} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Score hero — 1-10 grade as PRIMARY display (PRD §1.D.4) */}
        <section className="card text-center py-8 space-y-3">
          <p className="text-gray-500 text-sm">{t('results.grade')}</p>
          <p className={`text-7xl font-black ${gradeColor}`}>{grade.toFixed(1)}</p>

          {/* Pass/fail badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
            passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {passed ? t('results.passed') : t('results.failed')}
          </div>

          {/* Secondary stats */}
          <div className="flex justify-center gap-6 text-sm text-gray-500 pt-2">
            <div>
              <p className="font-bold text-gray-900">{scoreRaw}/40</p>
              <p>{t('results.raw_score')}</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">{scorePct.toFixed(0)}%</p>
              <p>{t('results.percentage')}</p>
            </div>
          </div>
        </section>

        {/* Category breakdown — all 8 KNM categories (PRD §1.D.4) */}
        <section className="card space-y-4">
          <h3 className="font-bold text-gray-900">{t('results.category_breakdown')}</h3>
          {KNM_CATEGORIES.map((cat) => {
            const catScore = session.category_scores?.[cat.id];
            const pct = catScore ? Math.round((catScore.correct / catScore.total) * 100) : 0;
            const color = pct >= 65 ? 'green' : pct >= 40 ? 'orange' : 'red';

            return (
              <div key={cat.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">{cat.label}</span>
                  <span className="text-gray-500">
                    {catScore ? `${catScore.correct}/${catScore.total}` : '–'}
                  </span>
                </div>
                <ProgressBar value={pct} color={color} height="normal" />
              </div>
            );
          })}
        </section>

        {/* AI Report section (PRD §1.D.4) */}
        {!aiReport ? (
          <section className={`card space-y-3 ${!isPremium ? 'relative overflow-hidden' : ''}`}>
            {!isPremium && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                <div className="text-center space-y-2 p-4">
                  <p className="font-bold text-gray-900">🔒 Premium Feature</p>
                  <p className="text-sm text-gray-500">Unlock your AI-powered analysis</p>
                </div>
              </div>
            )}
            <Button
              onClick={handleViewAiReport}
              isLoading={isLoadingAi}
              variant={isPremium ? 'primary' : 'secondary'}
              fullWidth
            >
              {isLoadingAi ? t('results.ai_analyzing') : t('results.view_ai_report')}
            </Button>
          </section>
        ) : (
          /* AI Report display */
          <section className="card space-y-4">
            <h3 className="font-bold text-gray-900">🤖 AI Analysis</h3>
            <div className="space-y-2">
              <p className="font-semibold text-sm text-gray-700">Top weak areas:</p>
              {aiReport.weak_areas.map((area) => (
                <div key={area} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  ⚠️ {KNM_CATEGORIES.find((c) => c.id === area)?.label ?? area}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm text-gray-700">Recommendations:</p>
              {aiReport.recommendations.map((rec, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">• {rec}</p>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={handleTryAgain} fullWidth>
            {t('results.try_again')}
          </Button>
          <Button onClick={() => router.push('/home')} variant="ghost" fullWidth>
            {t('general.back')} to Home
          </Button>
        </div>
      </main>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} trigger="ai_report" />
    </div>
  );
}
