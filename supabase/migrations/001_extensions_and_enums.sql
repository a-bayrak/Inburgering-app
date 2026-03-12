-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- query monitoring

-- ============================================================
-- SECTION 0: MIGRATION GUARD
-- Run order: 001 → 011. Never skip. Local → Staging → Prod.
-- ============================================================
