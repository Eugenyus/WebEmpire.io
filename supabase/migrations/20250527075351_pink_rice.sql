-- Add full_name column to stripe_checkout_sessions
ALTER TABLE stripe_checkout_sessions
ADD COLUMN full_name text;

-- Convert amount_total to use numeric for proper decimal handling
ALTER TABLE stripe_checkout_sessions
ALTER COLUMN amount_total TYPE numeric(10,2);

-- Create function to handle amount conversion
CREATE OR REPLACE FUNCTION convert_stripe_amount(amount numeric)
RETURNS numeric AS $$
BEGIN
    -- Convert from cents to dollars
    RETURN amount / 100;
END;
$$ LANGUAGE plpgsql;

-- Update existing amounts
UPDATE stripe_checkout_sessions
SET amount_total = convert_stripe_amount(amount_total)
WHERE amount_total IS NOT NULL;