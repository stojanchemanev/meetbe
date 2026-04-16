-- Add plan to businesses (free | growth)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'growth'));

-- Subscriptions table – mirrors Paddle subscription state.
-- Only the webhook (service role) writes here; owners can read their own row.
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  paddle_subscription_id  TEXT NOT NULL UNIQUE,
  paddle_customer_id      TEXT,
  status                  VARCHAR(30) NOT NULL DEFAULT 'active',
  plan                    VARCHAR(20) NOT NULL DEFAULT 'growth',
  current_period_end      TIMESTAMP WITH TIME ZONE,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_id   ON subscriptions(paddle_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Business owner can read their own subscription
CREATE POLICY "subscriptions_owner_read"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = subscriptions.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- Only service-role (webhook) may write – no client-side INSERT/UPDATE/DELETE policy
