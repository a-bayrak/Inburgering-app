-- ============================================================
-- AI GROUP: ai_cache, ai_conversations, ai_conversation_messages,
--           ai_cost_log, ai_daily_usage
-- DB Architecture v2.0 §3.14–3.18
-- ============================================================

-- ── ai_cache ──────────────────────────────────────────────────
-- SHA-256 hash key of (question_id + language + selected_option)
-- Targets 70-90% cache hit rate (PRD §20.1)
CREATE TABLE IF NOT EXISTS ai_cache (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key       TEXT        NOT NULL UNIQUE,  -- SHA-256 hex
  question_id     UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  language        TEXT        NOT NULL,
  selected_option TEXT        NOT NULL,         -- A, B, C, or 'correct'
  response_text   TEXT        NOT NULL,
  tokens_used     INTEGER     NOT NULL DEFAULT 0,
  hit_count       INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_cache_language
    CHECK (language IN ('nl','ar','fa','tr','en')),
  CONSTRAINT chk_cache_option
    CHECK (selected_option IN ('A','B','C','correct'))
);

CREATE INDEX idx_ai_cache_key ON ai_cache (cache_key);
CREATE INDEX idx_ai_cache_question ON ai_cache (question_id);

-- ── ai_conversations ─────────────────────────────────────────
-- Phase 1.1 post-beta. Table created now, activated later.
CREATE TABLE IF NOT EXISTS ai_conversations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic         TEXT,
  language      TEXT        NOT NULL DEFAULT 'nl',
  exchange_count INTEGER    NOT NULL DEFAULT 0,
  max_exchanges INTEGER     NOT NULL DEFAULT 15,
  status        TEXT        NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,

  CONSTRAINT chk_conv_status
    CHECK (status IN ('active','ended','expired'))
);

CREATE INDEX idx_ai_conv_user ON ai_conversations (user_id);

-- ── ai_conversation_messages ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversation_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  tokens_used     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_message_role
    CHECK (role IN ('user','assistant','system'))
);

CREATE INDEX idx_ai_messages_conv ON ai_conversation_messages (conversation_id);

-- ── ai_cost_log ───────────────────────────────────────────────
-- Per-request cost tracking. Powers AI Cost Monitor dashboard.
CREATE TABLE IF NOT EXISTS ai_cost_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  feature         TEXT        NOT NULL,
  model           TEXT        NOT NULL DEFAULT 'gpt-4o-mini',
  input_tokens    INTEGER     NOT NULL DEFAULT 0,
  output_tokens   INTEGER     NOT NULL DEFAULT 0,
  cost_eur        NUMERIC(10,6) NOT NULL DEFAULT 0,
  cache_hit       BOOLEAN     NOT NULL DEFAULT FALSE,
  question_id     UUID        REFERENCES questions(id) ON DELETE SET NULL,
  language        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_ai_feature
    CHECK (feature IN ('pause_and_learn','exam_report','conversation'))
);

CREATE INDEX idx_ai_cost_user ON ai_cost_log (user_id);
CREATE INDEX idx_ai_cost_date ON ai_cost_log (created_at);

-- ── ai_daily_usage ────────────────────────────────────────────
-- Daily cap enforcement per user (PRD §20.2 / MDC §1.C.7)
-- Caps: 100 pause_and_learn, 5 exam_reports, 3 conversations, 50k tokens/day
CREATE TABLE IF NOT EXISTS ai_daily_usage (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date            DATE    NOT NULL DEFAULT CURRENT_DATE,
  pause_and_learn_count INTEGER NOT NULL DEFAULT 0,
  exam_report_count     INTEGER NOT NULL DEFAULT 0,
  conversation_count    INTEGER NOT NULL DEFAULT 0,
  total_tokens          INTEGER NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, usage_date)
);

CREATE INDEX idx_ai_daily_user_date ON ai_daily_usage (user_id, usage_date);
