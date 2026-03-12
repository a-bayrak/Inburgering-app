-- ============================================================
-- USERS GROUP: users, user_devices, gdpr_consent_log
-- DB Architecture v2.0 §3.1–3.3
-- ============================================================

-- ⛔ SECURITY NOTE: streak_days is server-managed only.
-- RLS enforces that clients can NOT UPDATE streak_days directly.

CREATE TABLE IF NOT EXISTS users (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     TEXT          NOT NULL UNIQUE,
  display_name              TEXT,
  preferred_language        TEXT          NOT NULL DEFAULT 'nl',
  age_bracket               TEXT          NOT NULL DEFAULT 'adult',
  subscription_status       TEXT          NOT NULL DEFAULT 'free',
  subscription_tier         TEXT,
  subscription_expiry       TIMESTAMPTZ,
  subscription_platform     TEXT,
  revenuecat_id             TEXT,
  trial_activated_at        TIMESTAMPTZ,
  ai_consent_granted        BOOLEAN       NOT NULL DEFAULT FALSE,
  analytics_consent_granted BOOLEAN       NOT NULL DEFAULT FALSE,
  gdpr_consent_date         TIMESTAMPTZ,
  data_deletion_requested   BOOLEAN       NOT NULL DEFAULT FALSE,
  data_deletion_requested_at TIMESTAMPTZ,
  injection_flagged         BOOLEAN       NOT NULL DEFAULT FALSE,
  streak_days               INTEGER       NOT NULL DEFAULT 0,
  last_study_date           DATE,
  streak_freeze_available   INTEGER       NOT NULL DEFAULT 1,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT chk_users_language
    CHECK (preferred_language IN ('nl','ar','fa','tr','en')),
  CONSTRAINT chk_users_age_bracket
    CHECK (age_bracket IN ('under_16','age_16_17','adult')),
  CONSTRAINT chk_users_subscription
    CHECK (subscription_status IN ('free','trial','premium','expired','cancelled')),
  CONSTRAINT chk_users_sub_platform
    CHECK (subscription_platform IN ('stripe','ios','android') OR subscription_platform IS NULL),
  CONSTRAINT chk_users_sub_tier
    CHECK (subscription_tier IN ('monthly','annual') OR subscription_tier IS NULL),
  CONSTRAINT chk_streak_freeze
    CHECK (streak_freeze_available BETWEEN 0 AND 7)
);

CREATE INDEX idx_users_subscription ON users (subscription_status);
CREATE INDEX idx_users_streak ON users (streak_days DESC);

-- ── user_devices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_devices (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_type   TEXT          NOT NULL,
  device_name   TEXT,
  device_token  TEXT,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  last_seen_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT chk_device_type
    CHECK (device_type IN ('ios','android','web'))
);

CREATE INDEX idx_user_devices_user_id ON user_devices (user_id);
CREATE INDEX idx_user_devices_active_user ON user_devices (user_id, is_active);

-- ── gdpr_consent_log ─────────────────────────────────────────
-- INSERT-ONLY. No UPDATE/DELETE (enforced via RLS §5).
CREATE TABLE IF NOT EXISTS gdpr_consent_log (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type  TEXT          NOT NULL,
  granted       BOOLEAN       NOT NULL,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT chk_consent_type
    CHECK (consent_type IN ('account_data','ai_features','analytics'))
);

CREATE INDEX idx_gdpr_consent_user_id ON gdpr_consent_log (user_id);
CREATE INDEX idx_gdpr_consent_type_user ON gdpr_consent_log (user_id, consent_type);
