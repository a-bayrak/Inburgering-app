-- ============================================================
-- ANALYTICS GROUP: user_analytics, user_bookmarks
-- DB Architecture v2.0 §3.12–3.13
-- ============================================================

-- ── user_analytics ────────────────────────────────────────────
-- Server-authoritative. Clients read only. Never client-writable.
-- Populated and updated by trigger trg_update_analytics_on_complete.
CREATE TABLE IF NOT EXISTS user_analytics (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_exams_completed INTEGER     NOT NULL DEFAULT 0,
  total_sections_completed INTEGER  NOT NULL DEFAULT 0,
  avg_score_pct         NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_grade             NUMERIC(3,1) NOT NULL DEFAULT 0,
  best_score_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  best_grade            NUMERIC(3,1) NOT NULL DEFAULT 0,
  exams_passed          INTEGER     NOT NULL DEFAULT 0,
  total_study_time_sec  INTEGER     NOT NULL DEFAULT 0,
  -- Per-category accuracy across all 8 KNM categories
  category_accuracy     JSONB       DEFAULT '{}',
  last_exam_at          TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_user ON user_analytics (user_id);

-- ── user_bookmarks ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id   UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, question_id)
);

CREATE INDEX idx_bookmarks_user ON user_bookmarks (user_id);
