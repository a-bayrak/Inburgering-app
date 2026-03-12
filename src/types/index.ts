// Central type definitions — DB Architecture v2.0 + PRD §17
// Keep in sync with Supabase schema.

// ── Primitives ──────────────────────────────────────────────────────────────
export type Language = 'nl' | 'ar' | 'fa' | 'tr' | 'en';
export type AnswerOption = 'A' | 'B' | 'C'; // ⛔ NEVER D
export type SubscriptionStatus = 'free' | 'trial' | 'premium' | 'expired' | 'cancelled';
export type SubscriptionPlatform = 'stripe' | 'ios' | 'android';
export type SubscriptionTier = 'monthly' | 'annual';
export type QuestionStatus = 'draft' | 'review' | 'approved' | 'archived';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned' | 'auto_submitted';
export type MediaType = 'image' | 'audio' | 'video';
export type AdminRole = 'super_admin' | 'content_editor' | 'support';
export type AiFeature = 'pause_and_learn' | 'exam_report' | 'conversation';
export type AgeBracket = 'under_16' | 'age_16_17' | 'adult';
export type ConsentType = 'account_data' | 'ai_features' | 'analytics';
export type ExamType = 'knm_full' | 'knm_section' | 'knm_demo';

// ── Database Row Types ──────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  preferred_language: Language;
  age_bracket: AgeBracket;
  subscription_status: SubscriptionStatus;
  subscription_tier: SubscriptionTier | null;
  subscription_expiry: string | null;
  subscription_platform: SubscriptionPlatform | null;
  revenuecat_id: string | null;
  trial_activated_at: string | null;
  ai_consent_granted: boolean;
  analytics_consent_granted: boolean;
  gdpr_consent_date: string | null;
  data_deletion_requested: boolean;
  data_deletion_requested_at: string | null;
  injection_flagged: boolean;
  streak_days: number;
  last_study_date: string | null;
  streak_freeze_available: number;
  created_at: string;
  updated_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_type: 'ios' | 'android' | 'web';
  device_name: string | null;
  device_token: string | null;
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
}

export interface GdprConsentLog {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface QuestionCategory {
  id: string; // KNM-01 through KNM-08
  name_nl: string;
  name_en: string;
  description_nl: string | null;
  display_order: number;
  is_active: boolean;
}

export interface ContentMedia {
  id: string;
  media_type: MediaType;
  storage_path: string;
  mime_type: string;
  duration_sec: number | null;
  width_px: number | null;
  height_px: number | null;
  alt_text_nl: string | null;
  created_at: string;
}

// Full question row — service_role only (includes correct_answer)
export interface Question {
  id: string;
  category_id: string;
  status: QuestionStatus;
  question_nl: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: AnswerOption; // ⛔ NEVER send to client
  explanation_nl: string | null;
  explanation_en: string | null;
  explanation_ar: string | null;
  explanation_fa: string | null;
  explanation_tr: string | null;
  media_id: string | null;
  audio_media_id: string | null;
  theme_group_id: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  source_ref: string | null;
  created_at: string;
  updated_at: string;
}

// Client-safe question — correct_answer intentionally absent (PRD §1.B.9)
export interface QuestionClient {
  id: string;
  category_id: string;
  status: QuestionStatus;
  question_nl: string;
  option_a: string;
  option_b: string;
  option_c: string;
  // ⛔ NO correct_answer field
  explanation_nl: string | null;
  explanation_en: string | null;
  explanation_ar: string | null;
  explanation_fa: string | null;
  explanation_tr: string | null;
  media_id: string | null;
  audio_media_id: string | null;
  theme_group_id: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  // Joined relations
  media?: ContentMedia | null;
  audio_media?: ContentMedia | null;
}

export interface Exam {
  id: string;
  title: string;
  exam_type: ExamType;
  total_questions: number;
  time_limit_seconds: number;
  pass_threshold_pct: number;
  question_distribution: Record<string, number> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamQuestionGroup {
  id: string;
  exam_id: string;
  theme_title_nl: string;
  display_order: number;
  theme_video_media_id: string | null;
  created_at: string;
}

export interface ExamSession {
  id: string;
  user_id: string;
  exam_id: string;
  status: SessionStatus;
  instruction_started_at: string | null;
  exam_started_at: string | null;
  completed_at: string | null;
  time_remaining_sec: number | null;
  score_raw: number | null;
  score_pct: number | null;
  grade: number | null;
  passed: boolean | null;
  category_scores: Record<string, { correct: number; total: number; percentage: number }> | null;
  question_order: string[] | null;
  answers_snapshot: Record<string, AnswerOption | null> | null;
  created_at: string;
}

export interface ExamSessionAnswer {
  id: string;
  session_id: string;
  question_id: string;
  selected_option: AnswerOption | null;
  answered_at: string | null;
  time_spent_sec: number | null;
  is_paused: boolean;
}

export interface UserAnalytics {
  id: string;
  user_id: string;
  total_exams_completed: number;
  total_sections_completed: number;
  avg_score_pct: number;
  avg_grade: number;
  best_score_pct: number;
  best_grade: number;
  exams_passed: number;
  total_study_time_sec: number;
  category_accuracy: Record<string, { correct: number; total: number }> | null;
  last_exam_at: string | null;
  updated_at: string;
}

export interface UserBookmark {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
}

export interface AiCache {
  id: string;
  cache_key: string;
  question_id: string;
  language: Language;
  selected_option: AnswerOption | 'correct';
  response_text: string;
  tokens_used: number;
  hit_count: number;
  created_at: string;
  updated_at: string;
}

export interface AiDailyUsage {
  id: string;
  user_id: string;
  usage_date: string;
  pause_and_learn_count: number;
  exam_report_count: number;
  conversation_count: number;
  total_tokens: number;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

export interface UiTranslation {
  id: string;
  key: string;
  nl: string;
  en: string;
  ar: string;
  fa: string | null;
  tr: string | null;
  updated_at: string;
}

// ── API Response Types ──────────────────────────────────────────────────────

export interface AiExplanationResponse {
  explanation: string;
  language: Language;
  from_cache: boolean;
  from_static?: boolean;
  tokens_used: number;
}

export interface AiExamReportResponse {
  summary: string;
  weak_areas: string[]; // KNM category IDs
  recommendations: string[];
  tokens_used?: number;
  from_static?: boolean;
}

export interface ExamStartResponse {
  session_id: string;
  questions: QuestionClient[];
}

export interface ExamSubmitResponse {
  session_id: string;
  score_raw: number;
  grade: number;
  passed: boolean;
}
