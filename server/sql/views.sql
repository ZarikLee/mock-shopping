-- 友好视图（规范列直接展示）
CREATE OR REPLACE VIEW v_users AS SELECT id, account, nickname, role, created_at FROM users;
CREATE OR REPLACE VIEW v_projects AS SELECT id, user_id, name, type, start_date, created_at FROM projects;
CREATE OR REPLACE VIEW v_day_logs AS SELECT id, project_id, date, weekday, updated_at,
  jsonb_array_length(items) AS item_count,
  jsonb_array_length(files) AS file_count,
  jsonb_array_length(images) AS image_count FROM day_logs;
CREATE OR REPLACE VIEW v_feedback AS SELECT id, user_id, account, text, created_at,
  jsonb_array_length(replies) AS reply_count FROM feedback;
CREATE OR REPLACE VIEW v_versions AS SELECT id, log_id, version, created_at FROM log_versions;
