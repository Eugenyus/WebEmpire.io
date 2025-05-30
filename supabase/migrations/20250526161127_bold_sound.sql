-- Add status enum type
DO $$ BEGIN
    CREATE TYPE stripe_session_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- First set a temporary column
ALTER TABLE stripe_checkout_sessions 
ADD COLUMN status_new stripe_session_status;

-- Update the new column with converted values
UPDATE stripe_checkout_sessions 
SET status_new = CASE 
    WHEN status = 'pending' THEN 'pending'::stripe_session_status
    WHEN status = 'completed' THEN 'completed'::stripe_session_status
    ELSE 'failed'::stripe_session_status
END;

-- Drop the old column
ALTER TABLE stripe_checkout_sessions 
DROP COLUMN status;

-- Rename the new column
ALTER TABLE stripe_checkout_sessions 
RENAME COLUMN status_new TO status;

-- Set default value
ALTER TABLE stripe_checkout_sessions 
ALTER COLUMN status SET DEFAULT 'pending'::stripe_session_status;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_status 
ON stripe_checkout_sessions(status, session_id);