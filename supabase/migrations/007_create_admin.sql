-- ============================================================
-- ADMIN GROUP: admin_users, admin_audit_log
-- ⛔ admin_users is ENTIRELY SEPARATE from users table.
-- PRD §13.3 — these two auth realms must NEVER intersect.
-- DB Architecture v2.0 §3.19–3.20
-- ============================================================

-- ── admin_users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        NOT NULL UNIQUE,
  role            TEXT        NOT NULL DEFAULT 'content_editor',
  totp_secret     TEXT,                               -- 2FA TOTP secret
  totp_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_admin_role
    CHECK (role IN ('super_admin','content_editor','support'))
);

-- ── admin_audit_log ───────────────────────────────────────────
-- INSERT-ONLY. Cannot be updated or deleted. (PRD §13.2)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID        NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  action          TEXT        NOT NULL,
  resource_type   TEXT        NOT NULL,
  resource_id     TEXT,
  payload_before  JSONB,
  payload_after   JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_admin ON admin_audit_log (admin_id);
CREATE INDEX idx_audit_date ON admin_audit_log (created_at DESC);
CREATE INDEX idx_audit_resource ON admin_audit_log (resource_type, resource_id);
