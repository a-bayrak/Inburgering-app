-- ============================================================
-- CONFIG GROUP: ui_translations, app_settings, injection_flags,
--               ui_assets
-- DB Architecture v2.0 §3.21–3.24
-- ============================================================

-- ── ui_translations ───────────────────────────────────────────
-- All UI strings in all 5 languages. ~200 keys. Drives i18n.
CREATE TABLE IF NOT EXISTS ui_translations (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT    NOT NULL UNIQUE,  -- e.g. 'home.start_exam'
  nl          TEXT    NOT NULL,
  en          TEXT    NOT NULL,
  ar          TEXT    NOT NULL,
  fa          TEXT,                     -- Phase 1.2
  tr          TEXT,                     -- Phase 1.2
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_translations_key ON ui_translations (key);

-- ── app_settings ──────────────────────────────────────────────
-- Feature flags, pricing, AI caps, circuit breaker state.
-- Live operational config — no redeploy needed to change values.
CREATE TABLE IF NOT EXISTS app_settings (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT    NOT NULL UNIQUE,
  value       JSONB   NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_settings_key ON app_settings (key);

-- ── injection_flags ───────────────────────────────────────────
-- Records of prompt injection attempts. Feeds Layer 4 anomaly detection.
CREATE TABLE IF NOT EXISTS injection_flags (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  feature         TEXT        NOT NULL,
  input_text      TEXT        NOT NULL,
  flag_reason     TEXT        NOT NULL,
  action_taken    TEXT        NOT NULL DEFAULT 'logged',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_injection_action
    CHECK (action_taken IN ('logged','blocked','user_flagged'))
);

CREATE INDEX idx_injection_user ON injection_flags (user_id);
CREATE INDEX idx_injection_date ON injection_flags (created_at DESC);

-- ── ui_assets (DB v2.0 NEW) ───────────────────────────────────
-- App-level UI assets: logo, icons, style tokens.
-- Super-Admin access only. Separate from content_media.
CREATE TABLE IF NOT EXISTS ui_assets (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT    NOT NULL UNIQUE,   -- e.g. 'app.logo'
  asset_type  TEXT    NOT NULL,
  storage_path TEXT,
  value_json  JSONB,                     -- For style tokens
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_asset_type
    CHECK (asset_type IN ('image','svg','style_token'))
);
