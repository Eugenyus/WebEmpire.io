/*
  # Add checkout sessions table

  1. New Tables
    - `stripe_checkout_sessions`
      - Stores Stripe checkout session data
      - Tracks session status and payment details
*/

CREATE TABLE IF NOT EXISTS stripe_checkout_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text NOT NULL UNIQUE,
    customer_email text,
    amount_total bigint,
    currency text,
    payment_status text,
    payment_intent text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stripe_checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access for authenticated users"
    ON stripe_checkout_sessions
    FOR SELECT
    TO authenticated
    USING (true);

-- Create trigger for updated_at
CREATE TRIGGER set_checkout_sessions_updated_at
    BEFORE UPDATE ON stripe_checkout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();