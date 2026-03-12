'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useExamStore } from '@/store/useExamStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PauseLearnCard } from '@/components/exam/PauseLearnCard';
import { MediaPanel } from '@/components/exam/MediaPanel';
import type { AnswerOption } from '@/types';

export default function ExamSessionPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguageStore();
  const {
    sessionId, questions, currentIndex, answers, timeRemainingSeconds,
    status, pauseLearnQuestionId,
    setAnswer, nextQuestion, setTimeRemaining,
    triggerPauseLearn, closePauseLearn, setStatus, resetExam,
  } = useExamStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if no active session
  useEffect(() => {
    if (!sessionId || questions.length === 0) {
      router.replace('/exam/start');
    }
  }, [sessionId]);

  // Timer countdown (PRD §1.C.1 — timer starts at exam start, not instruction screen)
  useEffect(() => {
    if (status !== 'in_progress') return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(timeRemainingSeconds - 1);

      if (timeRemainingSeconds <= 1) {
        // Auto-submit on timer expiry (PRD §9.1.1 AC2)
        clearInterval(timerRef.current!);
        handleSubmit(true);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeRemainingSeconds]);

  // Save answers snapshot to local storage on every change (network drop recovery — PRD §1.C.2)
  useEffect(() => {
    if (sessionId && Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_snapshot_${sessionId}`, JSON.stringify({
        answers,
        timeRemainingSeconds,
        currentIndex,
      }));
    }
  }, [answers, timeRemainingSeconds]);

  const handleAnswer = async (option: AnswerOption) => {
    const question = questions[currentIndex];
    setAnswer(question.id, option);

    // Persist to Supabase
    await supabase.from('exam_session_answers').upsert({
      session_id: sessionId,
      question_id: question.id,
      selected_option: option,
      answered_at: new Date().toISOString(),
    }, { onConflict: 'session_id,question_id' });
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!sessionId || isSubmitting) return;
    setIsSubmitting(true);
    setStatus('submitting');

    try {
      const response = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          auto_submitted: autoSubmit,
          time_remaining: timeRemainingSeconds,
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      const result = await response.json();
      localStorage.removeItem(`exam_snapshot_${sessionId}`);
      router.push(`/exam/results/${result.session_id}`);
    } catch {
      setIsSubmitting(false);
      setStatus('in_progress');
    }
  }, [sessionId, isSubmitting, timeRemainingSeconds]);

  if (!sessionId || questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const question = questions[currentIndex];
  const selectedAnswer = answers[question.id] ?? null;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const timeMin = Math.floor(timeRemainingSeconds / 60);
  const timeSec = timeRemainingSeconds % 60;
  const isTimeLow = timeRemainingSeconds < 300; // < 5 min

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">

      {/* Exam Header (PRD §1.D.3) */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* Question counter */}
          <span className="text-sm font-medium text-gray-600 shrink-0">
            {t('exam.question')} {currentIndex + 1} {t('exam.of')} {questions.length}
          </span>

          {/* Progress bar */}
          <div className="flex-1">
            <ProgressBar value={answeredCount} max={questions.length} height="thin" color="primary" />
          </div>

          {/* Timer */}
          <div className={`shrink-0 font-mono font-bold text-sm px-3 py-1 rounded-full ${
            isTimeLow ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-brand-primary'
          }`}>
            {String(timeMin).padStart(2, '0')}:{String(timeSec).padStart(2, '0')}
          </div>

          {/* Volume slider (PRD §1.D.3) */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-gray-400 text-sm">🔊</span>
            <input
              type="range" min="0" max="1" step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16 accent-brand-primary"
              aria-label="Volume"
            />
          </div>
        </div>
      </header>

      {/* Two-panel layout (PRD §1.D.3)
          md+ = side by side, mobile = vertical stack, RTL = reversed */}
      <main className="flex-1 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row-reverse rtl:md:flex-row h-full">

          {/* Stimulus panel — LEFT (right in RTL) */}
          <div className="md:w-1/2 bg-gray-900 flex items-center justify-center min-h-48 md:min-h-0">
            <MediaPanel
              question={question}
              volume={volume}
              isPaused={pauseLearnQuestionId === question.id}
            />
          </div>

          {/* Answer panel — RIGHT (left in RTL) */}
          <div className="md:w-1/2 flex flex-col p-4 md:p-6 gap-4 overflow-y-auto">

            {/* Question text */}
            <p className="font-semibold text-gray-900 text-base leading-relaxed">
              {question.question_nl}
            </p>

            {/* Answer options — EXACTLY 3 (A, B, C only — PRD §1.B.9) */}
            <div className="space-y-3">
              {(['A', 'B', 'C'] as AnswerOption[]).map((option) => {
                const optionText = option === 'A' ? question.option_a
                  : option === 'B' ? question.option_b
                  : question.option_c;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={isSubmitting}
                    className={`answer-option ${selectedAnswer === option ? 'selected' : ''}`}
                  >
                    <span className="font-bold text-gray-400 me-3">{option}</span>
                    {optionText}
                  </button>
                );
              })}
            </div>

            {/* Pause & Learn (Premium only — PRD §7.1) */}
            {selectedAnswer && (
              <button
                onClick={() => triggerPauseLearn(question.id)}
                className="text-sm text-brand-primary font-medium py-2 flex items-center gap-2 hover:underline"
              >
                🤖 {t('exam.pause_learn')}
              </button>
            )}

            {/* Navigation */}
            <div className="mt-auto flex gap-3">
              {currentIndex < questions.length - 1 ? (
                <Button onClick={nextQuestion} fullWidth>
                  {t('onboarding.welcome.next')} →
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmit(false)}
                  isLoading={isSubmitting}
                  fullWidth
                  variant="primary"
                >
                  {t('exam.submit')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Pause & Learn overlay */}
      {pauseLearnQuestionId && (
        <PauseLearnCard
          questionId={pauseLearnQuestionId}
          selectedOption={answers[pauseLearnQuestionId] ?? null}
          onClose={closePauseLearn}
        />
      )}
    </div>
  );
}
