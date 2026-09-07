-- 纸上 Paper Todo · PostgreSQL 规范 Schema（真实字段列）
-- 用法：psql "$DATABASE_URL" -f server/sql/schema.sql
-- 说明：把之前 jsonb payload 拆成规范列；列表类数据(items/files/images/replies)仍用 jsonb。

CREATE TABLE IF NOT EXISTS users (
  id         bigserial PRIMARY KEY,
  account    text UNIQUE NOT NULL,
  password   text NOT NULL,
  nickname   text,
  role       text,
  created_at text,
  points         bigint NOT NULL DEFAULT 0,
  storage_bonus  bigint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS points_logs (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL,
  type       text,
  amount     bigint NOT NULL DEFAULT 0,
  note       text,
  created_at bigint
);
CREATE INDEX IF NOT EXISTS idx_plogs_user ON points_logs (user_id, created_at);

CREATE TABLE IF NOT EXISTS projects (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL,
  name       text NOT NULL,
  type       text,
  start_date text,
  created_at text
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects (user_id);

CREATE TABLE IF NOT EXISTS day_logs (
  id         bigserial PRIMARY KEY,
  project_id bigint NOT NULL,
  date       text NOT NULL,
  weekday    text,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  files      jsonb NOT NULL DEFAULT '[]'::jsonb,
  images     jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at text,
  updated_at text
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daylogs_project_date ON day_logs (project_id, date);

CREATE TABLE IF NOT EXISTS log_versions (
  id         bigserial PRIMARY KEY,
  log_id     bigint NOT NULL,
  version    int NOT NULL,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at text
);
CREATE INDEX IF NOT EXISTS idx_logversions_log ON log_versions (log_id);

CREATE TABLE IF NOT EXISTS feedback (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL,
  account    text,
  nickname   text,
  text       text,
  replies    jsonb NOT NULL DEFAULT '[]'::jsonb,
  status     text,
  created_at bigint
);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback (user_id);

CREATE TABLE IF NOT EXISTS sms_codes (
  id         bigserial PRIMARY KEY,
  phone      text,
  code       text,
  created_at bigint,
  expires_at bigint
);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_codes (phone);

CREATE TABLE IF NOT EXISTS notifications (
  id      bigserial PRIMARY KEY,
  user_id bigint NOT NULL,
  kind    text,
  title   text,
  text    text,
  at      bigint,
  read    boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id);
