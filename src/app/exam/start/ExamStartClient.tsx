'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useExamStore } from '@/store/useExamStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/Button';
import { TopBar } from '@/components/layout/TopBar';
import type { Exam, QuestionClient } from '@/types';

interface ExamStartClientProps {
  exam: Exam;
  existingSession: { id: string; created_at: string } | null;
  userId: string;
}

export function ExamStartClient({ exam, existingSession, userId }: ExamStartClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguageStore();
  const { initSession } = useExamStore();
  const router = useRouter();
  const supabase = createClient();

  const handleBeginExam = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: exam.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to start exam');
      }

      const { session_id, questions } = await response.json();

      initSession(session_id, exam.id, questions as QuestionClient[], exam.time_limit_seconds);

      router.push('/exam/session');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <TopBar title={t('exam.instruction.title')} backHref="/home" showLanguageSelector={false} />

      {/* Session conflict warning (PRD §1.C.8) */}
      {existingSession && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 text-center">
          <p className="text-orange-700 text-sm font-medium">
            ⚠️ {t('error.session_conflict')}
          </p>
        </div>
      )}

      {/* PRD §1.C.1 / §1.D.3: Pre-exam instruction screen
          Timer does NOT start here. Starts only when user taps "Begin Exam". */}
      <main className="flex-1 max-w-lg mx-auto px-6 py-8 flex flex-col gap-6 w-full">

        {/* Exam overview */}
        <section className="card space-y-4">
          <h2 className="font-bold text-gray-900 text-xl">{t('exam.instruction.title')}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-brand-primary">40</p>
              <p className="text-xs text-gray-500">{t('exam.instruction.questions')}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-brand-primary">45</p>
              <p className="text-xs text-gray-500">{t('exam.instruction.time')}</p>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="card space-y-3">
          <h3 className="font-semibold text-gray-900">{t('exam.instruction.tips.title')}</h3>
          {[
            t('exam.instruction.tip1'),
            t('exam.instruction.tip2'),
            t('exam.instruction.tip3'),
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-brand-primary font-bold text-sm shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
            </div>
          ))}
        </section>

        {/* Scoring info */}
        <section className="card text-sm text-gray-600 space-y-1">
          <p>✅ Pass: <strong>26/40 correct (grade ≥ 6.0)</strong></p>
          <p>📊 Grade: score ÷ 40 × 10, rounded to 1 decimal</p>
          <p>⏱ Timer starts when you tap <strong>Begin Exam</strong></p>
        </section>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="mt-auto">
          <Button onClick={handleBeginExam} isLoading={isLoading} fullWidth size="lg">
            {t('exam.instruction.start')}
          </Button>
        </div>
      </main>
    </div>
  );
}
