-- Add status enum type
DO $$ BEGIN
    CREATE TYPE stripe_session_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update status column to use enum
ALTER TABLE stripe_checkout_sessions 
ALTER COLUMN status TYPE stripe_session_status 
USING status::stripe_session_status;

-- Set default status
ALTER TABLE stripe_checkout_sessions 
ALTER COLUMN status SET DEFAULT 'pending';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_status 
ON stripe_checkout_sessions(status, session_id);