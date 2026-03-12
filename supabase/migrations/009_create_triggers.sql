-- ============================================================
-- TRIGGERS — DB Architecture v2.0 §4
-- ============================================================

-- ── 4.1 update_updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','questions','exams','ai_cache',
    'ai_daily_usage','ui_translations','app_settings','ui_assets'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ── 4.2 update_user_analytics_on_session_complete ─────────────
CREATE OR REPLACE FUNCTION fn_update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO user_analytics (
      user_id, total_exams_completed, avg_score_pct, avg_grade,
      best_score_pct, best_grade, exams_passed, last_exam_at, updated_at
    ) VALUES (
      NEW.user_id, 1, NEW.score_pct, NEW.grade,
      NEW.score_pct, NEW.grade,
      CASE WHEN NEW.passed THEN 1 ELSE 0 END,
      NEW.completed_at, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_exams_completed = user_analytics.total_exams_completed + 1,
      avg_score_pct = (
        (user_analytics.avg_score_pct * user_analytics.total_exams_completed)
        + NEW.score_pct
      ) / (user_analytics.total_exams_completed + 1),
      avg_grade = (
        (user_analytics.avg_grade * user_analytics.total_exams_completed)
        + NEW.grade
      ) / (user_analytics.total_exams_completed + 1),
      best_score_pct = GREATEST(user_analytics.best_score_pct, NEW.score_pct),
      best_grade     = GREATEST(user_analytics.best_grade,     NEW.grade),
      exams_passed   = user_analytics.exams_passed
                       + CASE WHEN NEW.passed THEN 1 ELSE 0 END,
      last_exam_at   = NEW.completed_at,
      updated_at     = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_analytics_on_complete
AFTER UPDATE ON exam_sessions
FOR EACH ROW EXECUTE FUNCTION fn_update_user_analytics();

-- ── 4.3 enforce_device_limit ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_enforce_device_limit()
RETURNS TRIGGER AS $$
DECLARE active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM user_devices WHERE user_id = NEW.user_id AND is_active = TRUE;

  IF active_count >= (
    SELECT (value#>>'{}'::TEXT[])::INTEGER
    FROM app_settings WHERE key = 'max_devices_per_user'
  ) THEN
    UPDATE user_devices SET is_active = FALSE
    WHERE id = (
      SELECT id FROM user_devices
      WHERE user_id = NEW.user_id AND is_active = TRUE
      ORDER BY last_seen_at ASC LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_device_limit
BEFORE INSERT ON user_devices
FOR EACH ROW EXECUTE FUNCTION fn_enforce_device_limit();

-- ── 4.4 auto_flag_injection_user ──────────────────────────────
-- If a user accumulates 3+ injection flags, set injection_flagged = TRUE
CREATE OR REPLACE FUNCTION fn_auto_flag_injection_user()
RETURNS TRIGGER AS $$
DECLARE flag_count INTEGER;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO flag_count
    FROM injection_flags WHERE user_id = NEW.user_id;

    IF flag_count >= 3 THEN
      UPDATE users SET injection_flagged = TRUE WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_flag_injection
AFTER INSERT ON injection_flags
FOR EACH ROW EXECUTE FUNCTION fn_auto_flag_injection_user();

-- ── 4.5 streak_update_on_session_complete ─────────────────────
CREATE OR REPLACE FUNCTION fn_update_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  today_date DATE := CURRENT_DATE;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT last_study_date INTO last_date FROM users WHERE id = NEW.user_id;

    IF last_date IS NULL OR last_date < today_date - INTERVAL '1 day' THEN
      -- Reset streak (unless freeze available — handled server-side)
      UPDATE users SET
        streak_days = CASE
          WHEN last_date = today_date - INTERVAL '1 day' THEN streak_days + 1
          ELSE 1
        END,
        last_study_date = today_date
      WHERE id = NEW.user_id;
    ELSIF last_date = today_date THEN
      -- Already studied today — update date but not streak count
      NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_streak
AFTER UPDATE ON exam_sessions
FOR EACH ROW EXECUTE FUNCTION fn_update_streak();
