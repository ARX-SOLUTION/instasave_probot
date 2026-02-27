CREATE TYPE media_request_source_type AS ENUM ('TELEGRAM_REEL_LINK', 'INSTAGRAM_WEBHOOK');
CREATE TYPE media_request_status AS ENUM ('NEW', 'FETCHING', 'READY', 'POSTED', 'FAILED');
CREATE TYPE outbound_post_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'DEAD');

CREATE TABLE media_requests (
  id uuid PRIMARY KEY,
  source_type media_request_source_type NOT NULL,
  chat_id bigint,
  message_id integer,
  telegram_user_id bigint,
  original_url text NOT NULL,
  normalized_url text NOT NULL,
  instagram_media_id text,
  status media_request_status NOT NULL DEFAULT 'NEW',
  error_reason text,
  idempotency_key varchar(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX media_requests_created_at_idx ON media_requests (created_at);
CREATE INDEX media_requests_status_created_at_idx ON media_requests (status, created_at);

CREATE TABLE instagram_media (
  id uuid PRIMARY KEY,
  media_id text NOT NULL UNIQUE,
  media_type text NOT NULL,
  product_type text NOT NULL,
  permalink text NOT NULL,
  media_url text,
  caption text,
  "timestamp" timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX instagram_media_created_at_idx ON instagram_media (created_at);

CREATE TABLE telegram_media (
  id uuid PRIMARY KEY,
  media_type text NOT NULL DEFAULT 'TELEGRAM_VIDEO',
  file_id text NOT NULL,
  file_unique_id text NOT NULL UNIQUE,
  chat_id bigint NOT NULL,
  message_id integer NOT NULL,
  telegram_user_id bigint NOT NULL,
  storage_key text NOT NULL,
  mime_type text,
  file_size bigint,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX telegram_media_created_at_idx ON telegram_media (created_at);

CREATE TABLE outbound_posts (
  id uuid PRIMARY KEY,
  media_request_id uuid REFERENCES media_requests (id) ON DELETE SET NULL,
  instagram_media_row_id uuid REFERENCES instagram_media (id) ON DELETE SET NULL,
  target_chat_id bigint NOT NULL,
  status outbound_post_status NOT NULL DEFAULT 'PENDING',
  telegram_message_id integer,
  error_reason text,
  retry_count integer NOT NULL DEFAULT 0,
  idempotency_key varchar(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbound_posts_created_at_idx ON outbound_posts (created_at);
CREATE INDEX outbound_posts_status_created_at_idx ON outbound_posts (status, created_at);

CREATE TABLE banned_users (
  telegram_user_id bigint PRIMARY KEY,
  reason text,
  banned_by bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bot_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE processing_failures (
  id uuid PRIMARY KEY,
  job_name text NOT NULL,
  payload jsonb NOT NULL,
  error_reason text NOT NULL,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX processing_failures_created_at_idx ON processing_failures (created_at);
