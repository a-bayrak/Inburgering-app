'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuestionClient, ExamSession, AnswerOption } from '@/types';

interface ExamState {
  // Active session
  sessionId: string | null;
  examId: string | null;
  questions: QuestionClient[];
  currentIndex: number;
  answers: Record<string, AnswerOption | null>; // questionId → answer
  timeRemainingSeconds: number;
  examStartedAt: string | null;
  status: 'idle' | 'instruction' | 'in_progress' | 'submitting' | 'completed';

  // Pause & Learn
  pauseLearnQuestionId: string | null;

  // Actions
  initSession: (sessionId: string, examId: string, questions: QuestionClient[], timeLimitSec: number) => void;
  setAnswer: (questionId: string, option: AnswerOption) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  setTimeRemaining: (seconds: number) => void;
  startExamTimer: () => void;
  triggerPauseLearn: (questionId: string) => void;
  closePauseLearn: () => void;
  setStatus: (status: ExamState['status']) => void;
  resetExam: () => void;
}

const initialState = {
  sessionId: null,
  examId: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  timeRemainingSeconds: 2700, // 45 min default
  examStartedAt: null,
  status: 'idle' as const,
  pauseLearnQuestionId: null,
};

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      ...initialState,

      initSession: (sessionId, examId, questions, timeLimitSec) => {
        set({
          sessionId,
          examId,
          questions,
          currentIndex: 0,
          answers: {},
          timeRemainingSeconds: timeLimitSec,
          examStartedAt: null,
          status: 'instruction',
          pauseLearnQuestionId: null,
        });
      },

      setAnswer: (questionId, option) => {
        set((state) => ({
          answers: { ...state.answers, [questionId]: option },
        }));
      },

      nextQuestion: () => {
        const { currentIndex, questions } = get();
        if (currentIndex < questions.length - 1) {
          set({ currentIndex: currentIndex + 1, pauseLearnQuestionId: null });
        }
      },

      prevQuestion: () => {
        // NOTE: KNM exam spec says no going back (PRD §exam.instruction.tip2)
        // Kept for section practice mode only
        const { currentIndex } = get();
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 });
        }
      },

      goToQuestion: (index) => {
        const { questions } = get();
        if (index >= 0 && index < questions.length) {
          set({ currentIndex: index, pauseLearnQuestionId: null });
        }
      },

      setTimeRemaining: (seconds) => set({ timeRemainingSeconds: seconds }),

      startExamTimer: () => {
        set({ examStartedAt: new Date().toISOString(), status: 'in_progress' });
      },

      triggerPauseLearn: (questionId) => {
        set({ pauseLearnQuestionId: questionId });
      },

      closePauseLearn: () => {
        set({ pauseLearnQuestionId: null });
      },

      setStatus: (status) => set({ status }),

      resetExam: () => set(initialState),
    }),
    {
      name: 'inburgering-exam-session',
      // Only persist answers + timeRemaining for network-drop recovery (PRD §9.1.1)
      partialize: (state) => ({
        sessionId: state.sessionId,
        examId: state.examId,
        answers: state.answers,
        timeRemainingSeconds: state.timeRemainingSeconds,
        examStartedAt: state.examStartedAt,
        currentIndex: state.currentIndex,
      }),
    }
  )
);
