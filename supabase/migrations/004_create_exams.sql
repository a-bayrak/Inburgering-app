-- ============================================================
-- EXAMS GROUP: exams, exam_questions, exam_question_groups,
--              exam_sessions, exam_session_answers
-- DB Architecture v2.0 §3.7–3.11
-- ============================================================

-- ── exams ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exams (
  id                    UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT      NOT NULL,
  exam_type             TEXT      NOT NULL DEFAULT 'knm_full',
  total_questions       INTEGER   NOT NULL DEFAULT 40,
  time_limit_seconds    INTEGER   NOT NULL DEFAULT 2700,  -- 45 min
  pass_threshold_pct    NUMERIC(5,2) NOT NULL DEFAULT 65.0, -- 26/40 = 65%
  question_distribution JSONB,    -- per-category count targets
  is_active             BOOLEAN   NOT NULL DEFAULT FALSE, -- admin activates
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_exam_type
    CHECK (exam_type IN ('knm_full','knm_section','knm_demo')),
  CONSTRAINT chk_total_questions
    CHECK (total_questions > 0),
  CONSTRAINT chk_time_limit
    CHECK (time_limit_seconds > 0)
);

-- ── exam_question_groups (DB v2.0 NEW) ────────────────────────
-- Theme groups within an exam — share an intro video
CREATE TABLE IF NOT EXISTS exam_question_groups (
  id                    UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id               UUID      NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  theme_title_nl        TEXT      NOT NULL,
  display_order         INTEGER   NOT NULL,
  theme_video_media_id  UUID      REFERENCES content_media(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_eq_groups_exam ON exam_question_groups (exam_id);

-- Back-fill the FK on questions that references exam_question_groups
ALTER TABLE questions
  ADD CONSTRAINT fk_questions_theme_group
  FOREIGN KEY (theme_group_id)
  REFERENCES exam_question_groups(id)
  ON DELETE SET NULL;

-- ── exam_questions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_questions (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID    NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id     UUID    NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  display_order   INTEGER NOT NULL,

  UNIQUE (exam_id, question_id)
);

CREATE INDEX idx_exam_questions_exam ON exam_questions (exam_id);
CREATE INDEX idx_exam_questions_question ON exam_questions (question_id);

-- ── exam_sessions ─────────────────────────────────────────────
-- State machine: in_progress → completed | abandoned | auto_submitted
CREATE TABLE IF NOT EXISTS exam_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id           UUID        NOT NULL REFERENCES exams(id) ON DELETE RESTRICT,
  status            TEXT        NOT NULL DEFAULT 'in_progress',

  -- Timing
  instruction_started_at  TIMESTAMPTZ,  -- when instruction screen shown
  exam_started_at         TIMESTAMPTZ,  -- when "Begin Exam" tapped
  completed_at            TIMESTAMPTZ,
  time_remaining_sec      INTEGER,      -- saved on network drop

  -- Scoring (server-computed only — PRD §9.2.1)
  score_raw         INTEGER,            -- correct answers count
  score_pct         NUMERIC(5,2),       -- (score_raw/40)*100
  grade             NUMERIC(3,1),       -- round((score_raw/40)*10, 1)
  passed            BOOLEAN,            -- grade >= 6.0
  category_scores   JSONB,              -- {KNM-01: {correct:3, total:5}, ...}

  -- Session cache (questions loaded at start — PRD §9.1)
  question_order    JSONB,              -- array of question IDs in display order
  answers_snapshot  JSONB,              -- local backup for network drop recovery

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_session_status
    CHECK (status IN ('in_progress','completed','abandoned','auto_submitted')),
  CONSTRAINT chk_score_pct
    CHECK (score_pct IS NULL OR score_pct BETWEEN 0 AND 100),
  CONSTRAINT chk_grade
    CHECK (grade IS NULL OR grade BETWEEN 1.0 AND 10.0)
);

CREATE INDEX idx_sessions_user ON exam_sessions (user_id);
CREATE INDEX idx_sessions_status ON exam_sessions (status);
CREATE INDEX idx_sessions_user_exam ON exam_sessions (user_id, exam_id);

-- ── exam_session_answers ──────────────────────────────────────
-- Source of truth for server-side scoring. One row per question per session.
-- ⛔ selected_option: only A, B, C. Never D.
CREATE TABLE IF NOT EXISTS exam_session_answers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID        NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id     UUID        NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  selected_option TEXT,                   -- NULL = not yet answered
  answered_at     TIMESTAMPTZ,
  time_spent_sec  INTEGER,
  is_paused       BOOLEAN     NOT NULL DEFAULT FALSE, -- Pause-and-Learn triggered

  UNIQUE (session_id, question_id),
  CONSTRAINT chk_selected_option
    CHECK (selected_option IN ('A','B','C') OR selected_option IS NULL)
);

CREATE INDEX idx_session_answers_session ON exam_session_answers (session_id);
CREATE INDEX idx_session_answers_question ON exam_session_answers (question_id);
