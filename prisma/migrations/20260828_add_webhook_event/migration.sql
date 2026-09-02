-- Migration: add_webhook_event
-- Creates table webhook_event for idempotent webhook processing

-- Ensure uuid extension is available (postgres)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS webhook_event (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_hash text NOT NULL UNIQUE,
  order_id text,
  event_type text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookups by order_id
CREATE INDEX IF NOT EXISTS idx_webhook_event_order_id ON webhook_event(order_id);
