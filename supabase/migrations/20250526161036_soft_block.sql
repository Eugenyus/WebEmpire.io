-- Add metadata column to store additional information
ALTER TABLE stripe_checkout_sessions
ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;

-- Create index for metadata
CREATE INDEX idx_stripe_sessions_metadata 
ON stripe_checkout_sessions USING gin(metadata);