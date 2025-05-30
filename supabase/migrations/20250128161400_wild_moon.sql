-- Create the debug_logs table first
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operation text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Grant permissions for the debug_logs table
GRANT ALL ON public.debug_logs TO authenticated;
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for debug_logs
CREATE POLICY "Allow all access to debug_logs for authenticated users"
    ON public.debug_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);