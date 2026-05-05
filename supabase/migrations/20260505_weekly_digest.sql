-- Weekly digest subscriptions
-- One row per (email, ga4_property_id) pair.
-- encrypted_refresh_token is AES-GCM encrypted using DIGEST_ENCRYPTION_KEY env var.
CREATE TABLE IF NOT EXISTS public.weekly_digest_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  google_email text,
  ga4_property_id text NOT NULL,
  ga4_property_name text,
  encrypted_refresh_token text NOT NULL,
  unsubscribe_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz,
  UNIQUE(email, ga4_property_id)
);

ALTER TABLE public.weekly_digest_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only service role (server-side) can access this table
CREATE POLICY "service_role_only" ON public.weekly_digest_subscriptions
  USING (false)
  WITH CHECK (false);

-- Audit log of every send attempt
CREATE TABLE IF NOT EXISTS public.weekly_digest_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.weekly_digest_subscriptions(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL, -- 'success' | 'error'
  resend_message_id text,
  error_message text
);

ALTER TABLE public.weekly_digest_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON public.weekly_digest_sends
  USING (false)
  WITH CHECK (false);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wds_email
  ON public.weekly_digest_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_wds_google_email
  ON public.weekly_digest_subscriptions(google_email);
CREATE INDEX IF NOT EXISTS idx_wds_unsubscribe_token
  ON public.weekly_digest_subscriptions(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_wds_active
  ON public.weekly_digest_subscriptions(is_active)
  WHERE is_active = true;
