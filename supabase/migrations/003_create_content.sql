-- ============================================================
-- CONTENT GROUP: question_categories, questions, content_media
-- DB Architecture v2.0 §3.4–3.6
-- ============================================================

-- ── question_categories ──────────────────────────────────────
-- 8 official KNM categories (KNM-01 through KNM-08)
-- Bijlage 2, Regeling inburgering 2021 + July 2025 eindtermen revision
CREATE TABLE IF NOT EXISTS question_categories (
  id            TEXT          PRIMARY KEY,  -- e.g. 'KNM-01'
  name_nl       TEXT          NOT NULL,
  name_en       TEXT          NOT NULL,
  description_nl TEXT,
  display_order INTEGER       NOT NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,

  CONSTRAINT chk_category_id
    CHECK (id ~ '^KNM-0[1-8]$')
);

-- ── content_media ─────────────────────────────────────────────
-- Question content media ONLY. App UI assets → ui_assets table.
CREATE TABLE IF NOT EXISTS content_media (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type    TEXT          NOT NULL,
  storage_path  TEXT          NOT NULL,   -- Supabase Storage path
  mime_type     TEXT          NOT NULL,
  duration_sec  INTEGER,                  -- For audio/video
  width_px      INTEGER,                  -- For images
  height_px     INTEGER,
  alt_text_nl   TEXT,                     -- Accessibility
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT chk_media_type
    CHECK (media_type IN ('image','audio','video'))
);

CREATE INDEX idx_content_media_type ON content_media (media_type);

-- ── questions ─────────────────────────────────────────────────
-- ⛔ correct_answer is NEVER exposed to client RLS policies.
-- Only server-side Edge Functions (service_role) may read it.
CREATE TABLE IF NOT EXISTS questions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     TEXT          NOT NULL REFERENCES question_categories(id),
  status          TEXT          NOT NULL DEFAULT 'draft',

  -- Question text in Dutch (exam content is always Dutch, PRD §1)
  question_nl     TEXT          NOT NULL,

  -- Answer options — EXACTLY 3, A/B/C only (PRD §11.2, DB §0)
  option_a        TEXT          NOT NULL,
  option_b        TEXT          NOT NULL,
  option_c        TEXT          NOT NULL,

  -- ⛔ SERVER-SIDE ONLY — never in client RLS
  correct_answer  TEXT          NOT NULL,

  -- Multilingual explanations (for Pause-and-Learn)
  explanation_nl  TEXT,
  explanation_en  TEXT,
  explanation_ar  TEXT,
  explanation_fa  TEXT,
  explanation_tr  TEXT,

  -- Media references (PRD §11.2 — both required for 'approved' status)
  media_id        UUID          REFERENCES content_media(id) ON DELETE RESTRICT,
  audio_media_id  UUID          REFERENCES content_media(id) ON DELETE RESTRICT,

  -- Theme group (DB v2.0 — links to exam_question_groups)
  theme_group_id  UUID,         -- FK added after exam_question_groups created

  -- Metadata
  difficulty      TEXT          DEFAULT 'medium',
  source_ref      TEXT,         -- e.g. 'Staatscourant 2024, 15802'
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT chk_question_status
    CHECK (status IN ('draft','review','approved','archived')),
  CONSTRAINT chk_correct_answer
    CHECK (correct_answer IN ('A','B','C')),
  CONSTRAINT chk_difficulty
    CHECK (difficulty IN ('easy','medium','hard')),
  -- ⛔ A question without both media assets CANNOT be approved (PRD §11.4)
  CONSTRAINT chk_approved_has_media
    CHECK (
      status != 'approved' OR
      (media_id IS NOT NULL AND audio_media_id IS NOT NULL)
    )
);

CREATE INDEX idx_questions_category ON questions (category_id);
CREATE INDEX idx_questions_status ON questions (status);
CREATE INDEX idx_questions_approved_cat
  ON questions (category_id) WHERE status = 'approved';
-- GIN index for JSONB searches if needed
CREATE INDEX idx_questions_theme_group ON questions (theme_group_id);
