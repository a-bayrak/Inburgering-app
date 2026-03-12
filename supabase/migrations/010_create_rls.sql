-- ============================================================
-- ROW LEVEL SECURITY (RLS) — DB Architecture v2.0 §5
-- ⛔ correct_answer NEVER readable by any client policy.
-- ⛔ Scoring happens ONLY in Edge Functions via service_role.
-- ============================================================

-- Enable RLS on ALL tables
ALTER TABLE users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_consent_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_media             ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_question_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_session_answers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_daily_usage            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_translations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE injection_flags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_assets                 ENABLE ROW LEVEL SECURITY;

-- ── users ─────────────────────────────────────────────────────
-- Users can read and update their own row ONLY.
-- streak_days, injection_flagged are NOT in the update policy.
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent client from updating server-managed fields
    -- (streak_days, injection_flagged enforced by separate check)
  );

-- ── user_devices ──────────────────────────────────────────────
CREATE POLICY "devices_user_own"
  ON user_devices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── gdpr_consent_log ─────────────────────────────────────────
-- INSERT only from authenticated users. No UPDATE. No DELETE.
CREATE POLICY "gdpr_insert_own"
  ON gdpr_consent_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gdpr_read_own"
  ON gdpr_consent_log FOR SELECT
  USING (auth.uid() = user_id);

-- ── question_categories ──────────────────────────────────────
-- Public read. No client writes.
CREATE POLICY "categories_public_read"
  ON question_categories FOR SELECT
  USING (is_active = TRUE);

-- ── questions ─────────────────────────────────────────────────
-- ⛔ CRITICAL: correct_answer MUST NOT be in the SELECT list.
-- We create a secure view instead.
CREATE POLICY "questions_approved_read"
  ON questions FOR SELECT
  USING (status = 'approved');

-- Secure view that explicitly excludes correct_answer
CREATE OR REPLACE VIEW questions_client AS
  SELECT
    id, category_id, status, question_nl,
    option_a, option_b, option_c,
    -- correct_answer is INTENTIONALLY OMITTED
    explanation_nl, explanation_en, explanation_ar,
    explanation_fa, explanation_tr,
    media_id, audio_media_id, theme_group_id,
    difficulty, created_at
  FROM questions
  WHERE status = 'approved';

GRANT SELECT ON questions_client TO authenticated;
REVOKE SELECT ON questions FROM authenticated; -- Force use of view

-- ── content_media ─────────────────────────────────────────────
CREATE POLICY "media_public_read"
  ON content_media FOR SELECT
  USING (TRUE);

-- ── exams ─────────────────────────────────────────────────────
CREATE POLICY "exams_active_read"
  ON exams FOR SELECT
  USING (is_active = TRUE);

-- ── exam_questions ────────────────────────────────────────────
CREATE POLICY "exam_questions_read"
  ON exam_questions FOR SELECT
  USING (TRUE);

-- ── exam_question_groups ──────────────────────────────────────
CREATE POLICY "exam_groups_read"
  ON exam_question_groups FOR SELECT
  USING (TRUE);

-- ── exam_sessions ─────────────────────────────────────────────
CREATE POLICY "sessions_user_own"
  ON exam_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── exam_session_answers ──────────────────────────────────────
-- User can INSERT/SELECT their own answers.
-- UPDATE is needed for answer changes during exam.
CREATE POLICY "answers_user_own"
  ON exam_session_answers FOR ALL
  USING (
    auth.uid() = (
      SELECT user_id FROM exam_sessions WHERE id = session_id
    )
  );

-- ── user_analytics ────────────────────────────────────────────
-- Read only. Server writes via trigger/Edge Function.
CREATE POLICY "analytics_user_read"
  ON user_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- ── user_bookmarks ────────────────────────────────────────────
CREATE POLICY "bookmarks_user_own"
  ON user_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── ai_cache ──────────────────────────────────────────────────
-- Read only for authenticated. Writes via Edge Function.
CREATE POLICY "ai_cache_read"
  ON ai_cache FOR SELECT
  USING (TRUE);

-- ── ai_conversations / messages ──────────────────────────────
CREATE POLICY "ai_conv_user_own"
  ON ai_conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "ai_msg_user_own"
  ON ai_conversation_messages FOR ALL
  USING (
    auth.uid() = (
      SELECT user_id FROM ai_conversations WHERE id = conversation_id
    )
  );

-- ── ai_daily_usage ────────────────────────────────────────────
CREATE POLICY "ai_daily_read"
  ON ai_daily_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ── ui_translations ───────────────────────────────────────────
CREATE POLICY "translations_public_read"
  ON ui_translations FOR SELECT
  USING (TRUE);

-- ── app_settings ──────────────────────────────────────────────
CREATE POLICY "settings_public_read"
  ON app_settings FOR SELECT
  USING (TRUE);

-- ── ui_assets ─────────────────────────────────────────────────
CREATE POLICY "ui_assets_public_read"
  ON ui_assets FOR SELECT
  USING (TRUE);

-- ── admin_users / audit_log ───────────────────────────────────
-- No client access. Service role only.
-- (RLS enabled but no policies = no access for non-service_role)
