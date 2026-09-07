-- 友好视图：把 jsonb 展开成常规列，方便 DBeaver/报表直接 SELECT
CREATE OR REPLACE VIEW v_users AS
  SELECT id,
         payload->>'account'    AS account,
         payload->>'nickname'   AS nickname,
         payload->>'role'       AS role,
         (payload->>'createdAt') AS created_at
  FROM users;

CREATE OR REPLACE VIEW v_projects AS
  SELECT id,
         payload->>'userId'    AS user_id,
         payload->>'name'      AS name,
         payload->>'type'      AS type,
         payload->>'startDate' AS start_date,
         payload->>'createdAt' AS created_at
  FROM projects;

CREATE OR REPLACE VIEW v_day_logs AS
  SELECT id,
         payload->>'projectId' AS project_id,
         payload->>'date'      AS date,
         payload->>'weekday'   AS weekday,
         payload->>'updatedAt' AS updated_at,
         jsonb_array_length(COALESCE(payload->'items','[]'::jsonb)) AS item_count,
         payload->>'files'     IS NOT NULL AS has_files
  FROM day_logs;

CREATE OR REPLACE VIEW v_feedback AS
  SELECT id,
         payload->>'userId'   AS user_id,
         payload->>'account'  AS account,
         payload->>'text'     AS text,
         payload->>'createdAt' AS created_at,
         jsonb_array_length(COALESCE(payload->'replies','[]'::jsonb)) AS reply_count
  FROM feedback;
