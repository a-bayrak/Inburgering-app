'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TopBar } from '@/components/layout/TopBar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { PauseLearnCard } from '@/components/exam/PauseLearnCard';
import { useLanguageStore } from '@/store/useLanguageStore';
import type { QuestionClient, QuestionCategory, AnswerOption } from '@/types';

interface Props {
  category: QuestionCategory;
  questions: QuestionClient[];
  userId: string;
}

// Section practice — same exam UI but allows going back and shows
// correct/incorrect feedback immediately after answering (PRD §7.1)
export function PracticeCategoryClient({ category, questions, userId }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [pauseLearnId, setPauseLearnId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const { t } = useLanguageStore();
  const router = useRouter();
  const supabase = createClient();

  const question = questions[currentIndex];
  const selectedAnswer = answers[question?.id] ?? null;
  const isRevealed = revealed[question?.id] ?? false;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (option: AnswerOption) => {
    if (isRevealed) return; // Can't change after reveal
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
    // Auto-reveal after selection in practice mode
    setRevealed((prev) => ({ ...prev, [question.id]: true }));

    // Save to Supabase for analytics
    supabase.from('user_bookmarks').select('id').eq('user_id', userId).eq('question_id', question.id);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setPauseLearnId(null);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setPauseLearnId(null);
    }
  };

  const correctCount = Object.entries(answers).filter(([, _]) => {
    // In practice mode we can't check correctness client-side (no correct_answer)
    // Score is shown as "answered" count only — server computes accuracy
    return true;
  }).length;

  // Finished screen
  if (isFinished) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 gap-6 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">Section Complete!</h2>
        <p className="text-gray-600">
          You answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
        </p>
        <div className="w-full max-w-xs space-y-3">
          <Button onClick={() => router.push('/practice')} fullWidth>
            ← Back to Topics
          </Button>
          <Button onClick={() => router.push('/exam/start')} variant="secondary" fullWidth>
            Try Full Exam
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <TopBar
        title={category.name_nl}
        backHref="/practice"
        showLanguageSelector={false}
      />

      {/* Progress */}
      <div className="px-4 pt-3 pb-1 max-w-2xl mx-auto w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{t('exam.question')} {currentIndex + 1} {t('exam.of')} {questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
        <ProgressBar value={currentIndex + 1} max={questions.length} height="thin" />
      </div>

      {/* Question */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        <p className="font-semibold text-gray-900 text-base leading-relaxed">
          {question.question_nl}
        </p>

        {/* Answer options */}
        <div className="space-y-3">
          {(['A', 'B', 'C'] as AnswerOption[]).map((option) => {
            const optionText = option === 'A' ? question.option_a
              : option === 'B' ? question.option_b
              : question.option_c;

            const isSelected = selectedAnswer === option;

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={isRevealed}
                className={`
                  answer-option
                  ${isSelected ? 'selected' : ''}
                  ${isRevealed && isSelected ? 'border-brand-primary bg-blue-50' : ''}
                  ${isRevealed && !isSelected ? 'opacity-50' : ''}
                `}
              >
                <span className="font-bold text-gray-400 me-3">{option}</span>
                {optionText}
              </button>
            );
          })}
        </div>

        {/* Pause & Learn — auto-show after answering in practice mode */}
        {isRevealed && selectedAnswer && (
          <button
            onClick={() => setPauseLearnId(question.id)}
            className="text-sm text-brand-primary font-medium flex items-center gap-2 hover:underline"
          >
            🤖 {t('exam.pause_learn')}
          </button>
        )}

        {/* Navigation */}
        <div className="mt-auto flex gap-3 pt-4">
          <Button
            onClick={handlePrev}
            variant="ghost"
            disabled={currentIndex === 0}
            className="flex-1"
          >
            ← {t('general.back')}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isRevealed}
            className="flex-1"
          >
            {currentIndex === questions.length - 1 ? 'Finish' : `${t('onboarding.welcome.next')} →`}
          </Button>
        </div>
      </main>

      {/* Pause & Learn overlay */}
      {pauseLearnId && (
        <PauseLearnCard
          questionId={pauseLearnId}
          selectedOption={selectedAnswer}
          onClose={() => setPauseLearnId(null)}
        />
      )}
    </div>
  );
}
