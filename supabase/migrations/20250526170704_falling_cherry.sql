-- Drop existing policy
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON stripe_checkout_sessions;

-- Create new policy allowing public access
CREATE POLICY "Allow public access to sessions"
    ON stripe_checkout_sessions
    FOR SELECT
    TO public
    USING (true);

-- Grant necessary permissions
GRANT SELECT ON stripe_checkout_sessions TO anon;