-- 纸上 Paper Todo · PostgreSQL Schema
-- 用法：psql "$DATABASE_URL" -f server/sql/schema.sql
-- 每张表：id 主键 + payload(jsonb) 存整条记录（兼容现有 JSON 结构），
-- 便于 DBeaver 直接连接查看/编辑；后续逐步拆出规范列。

CREATE TABLE IF NOT EXISTS users (
  id        bigserial PRIMARY KEY,
  payload   jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS projects (
  id        bigserial PRIMARY KEY,
  payload   jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS day_logs (
  id        bigserial PRIMARY KEY,
  payload   jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS log_versions (
  id        bigserial PRIMARY KEY,
  payload   jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS feedback (
  id        bigserial PRIMARY KEY,
  payload   jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS sms_codes (
  id        bigserial PRIMARY KEY,
  payload   jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS notifications (
  id        bigserial PRIMARY KEY,
  payload   jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_users_account      ON users      ((payload->>'account'));
CREATE INDEX IF NOT EXISTS idx_projects_user      ON projects   ((payload->>'userId'));
CREATE INDEX IF NOT EXISTS idx_daylogs_project    ON day_logs   ((payload->>'projectId'));
CREATE INDEX IF NOT EXISTS idx_daylogs_date       ON day_logs   ((payload->>'date'));
CREATE INDEX IF NOT EXISTS idx_logversions_log    ON log_versions ((payload->>'logId'));
CREATE INDEX IF NOT EXISTS idx_feedback_user      ON feedback   ((payload->>'userId'));
CREATE INDEX IF NOT EXISTS idx_sms_phone          ON sms_codes  ((payload->>'phone'));
CREATE INDEX IF NOT EXISTS idx_notif_user         ON notifications ((payload->>'userId'));
