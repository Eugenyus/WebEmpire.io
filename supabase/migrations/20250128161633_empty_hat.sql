-- First, create the debug_logs table
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

-- Create function to handle logging
CREATE OR REPLACE FUNCTION public.log_operation(
    operation_name text,
    operation_details jsonb
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.debug_logs (operation, details)
    VALUES (operation_name, operation_details);
EXCEPTION WHEN OTHERS THEN
    -- If logging fails, we don't want to break the main operation
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;