'use client';

import { useEffect, useState } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { AnswerOption, AiExplanationResponse } from '@/types';

interface PauseLearnCardProps {
  questionId: string;
  selectedOption: AnswerOption | null;
  onClose: () => void;
}

// PRD §1.C.5: Check cache first. 8s timeout → show static fallback.
export function PauseLearnCard({ questionId, selectedOption, onClose }: PauseLearnCardProps) {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const { language, t } = useLanguageStore();

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    fetch('/api/ai/pause-and-learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, selected_option: selectedOption, language }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: AiExplanationResponse) => {
        setExplanation(data.explanation);
        setIsFallback(false);
      })
      .catch(async () => {
        // Timeout or error — show static fallback (PRD §1.C.5)
        const res = await fetch(`/api/ai/static-explanation?question_id=${questionId}&language=${language}`);
        const data = await res.json();
        setExplanation(data.explanation ?? 'No explanation available.');
        setIsFallback(true);
      })
      .finally(() => {
        clearTimeout(timeout);
        setIsLoading(false);
      });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [questionId, selectedOption, language]);

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Card slides up */}
      <div className="relative w-full bg-white rounded-t-3xl p-5 max-h-[60vh] overflow-y-auto shadow-2xl
                      animate-[slideUp_0.3s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h3 className="font-bold text-gray-900">{t('exam.pause_learn')}</h3>
            {isFallback && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {t('error.ai_fallback')}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-8 gap-3">
            {/* Pulsing card animation (PRD §1.G.1) */}
            <LoadingSpinner size="md" />
            <div className="space-y-2 w-full">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed text-sm">{explanation}</p>
        )}
      </div>
    </div>
  );
}
