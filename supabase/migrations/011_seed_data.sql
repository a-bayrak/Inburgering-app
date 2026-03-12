-- ============================================================
-- SEED DATA — DB Architecture v2.0 §6
-- Required before the app can run on Day 1.
-- ============================================================

-- ── 6.1 question_categories ───────────────────────────────────
-- 8 official KNM categories (July 2025 eindtermen revision)
INSERT INTO question_categories (id, name_nl, name_en, display_order, is_active) VALUES
  ('KNM-01', 'Werk en inkomen',                    'Work & Income',                    1, TRUE),
  ('KNM-02', 'Omgangsvormen, waarden en normen',   'Customs, Values & Norms',          2, TRUE),
  ('KNM-03', 'Wonen in Nederland',                  'Living in the Netherlands',         3, TRUE),
  ('KNM-04', 'Gezondheid en gezondheidszorg',       'Health & Healthcare',               4, TRUE),
  ('KNM-05', 'Geschiedenis en geografie',           'History & Geography',               5, TRUE),
  ('KNM-06', 'Instanties',                          'Public Institutions',               6, FALSE), -- gated, no questions yet
  ('KNM-07', 'Staatsinrichting en rechtsstaat',     'Government & Rule of Law',         7, FALSE), -- gated, no questions yet
  ('KNM-08', 'Onderwijs',                           'Education',                         8, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── 6.2 app_settings ──────────────────────────────────────────
INSERT INTO app_settings (key, value, description) VALUES
  ('max_devices_per_user',        '3',                   'Max concurrent active devices per user'),
  ('premium_price_eur',           '"9.99"',              'Monthly subscription price in EUR'),
  ('trial_duration_days',         '3',                   '3-day free trial duration'),
  ('ai_cap_pause_and_learn',      '100',                 'Daily Pause-and-Learn calls per premium user'),
  ('ai_cap_exam_reports',         '5',                   'Daily end-of-exam AI reports per premium user'),
  ('ai_cap_conversations',        '3',                   'Daily AI conversation sessions per premium user'),
  ('ai_cap_tokens_daily',         '50000',               'Daily total token cap per premium user'),
  ('ai_circuit_breaker_active',   'false',               'When true: all AI features fall back to static'),
  ('ai_global_spend_limit_eur',   '"20"',                'Monthly AI spend circuit breaker threshold in EUR'),
  ('min_questions_per_exam',      '40',                  'Minimum approved questions required to start exam'),
  ('min_questions_per_section',   '15',                  'Minimum questions per section practice session'),
  ('free_exams_allowed',          '1',                   'Number of exams free users can take'),
  ('free_sections_allowed',       '1',                   'Number of section sessions free users can take per day'),
  ('beta_mode',                   'true',                'Beta mode flag — KNM only scope'),
  ('maintenance_mode',            'false',               'When true: show maintenance screen')
ON CONFLICT (key) DO NOTHING;

-- ── 6.3 ui_assets (minimal starter set) ──────────────────────
INSERT INTO ui_assets (key, asset_type, value_json) VALUES
  ('ui.primary_color',          'style_token', '{"color": "#2E4A6E"}'),
  ('ui.button_border_radius',   'style_token', '{"border_radius": "8px"}'),
  ('ui.progress_bar_height',    'style_token', '{"height": "4px"}'),
  ('ui.progress_bar_style',     'style_token', '{"style": "filled"}')
ON CONFLICT (key) DO NOTHING;
