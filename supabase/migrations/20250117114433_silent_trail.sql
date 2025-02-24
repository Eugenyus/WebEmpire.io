/*
  # Clean up dashboards table structure and constraints

  1. Changes
    - Ensures proper table structure with all required columns
    - Removes duplicate constraints
    - Adds composite unique constraint for profile_id and interest_area
    - Cleans up any duplicate entries
    - Ensures proper RLS policies

  2. Security
    - Maintains RLS enabled
    - Recreates all necessary RLS policies
    - Ensures proper access control
*/

DO $$ 
BEGIN
  -- Ensure proper table structure
  CREATE TABLE IF NOT EXISTS public.dashboards_new (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id),
    interest_area text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Copy existing data, removing duplicates
  INSERT INTO public.dashboards_new (id, profile_id, interest_area, created_at, updated_at)
  SELECT DISTINCT ON (profile_id, interest_area) 
    id, profile_id, interest_area, created_at, updated_at
  FROM public.dashboards
  ORDER BY profile_id, interest_area, created_at DESC;

  -- Drop old table and rename new one
  DROP TABLE public.dashboards;
  ALTER TABLE public.dashboards_new RENAME TO dashboards;

  -- Add composite unique constraint
  ALTER TABLE public.dashboards
  ADD CONSTRAINT unique_profile_interest 
  UNIQUE (profile_id, interest_area);

  -- Enable RLS
  ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

  -- Recreate all policies
  DROP POLICY IF EXISTS "Users can view own dashboard" ON public.dashboards;
  DROP POLICY IF EXISTS "Users can insert own dashboard" ON public.dashboards;
  DROP POLICY IF EXISTS "Users can update own dashboard" ON public.dashboards;

  -- Create new policies
  CREATE POLICY "Users can view own dashboard"
    ON public.dashboards
    FOR SELECT
    TO authenticated
    USING (
      profile_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can insert own dashboard"
    ON public.dashboards
    FOR INSERT
    TO authenticated
    WITH CHECK (
      profile_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can update own dashboard"
    ON public.dashboards
    FOR UPDATE
    TO authenticated
    USING (
      profile_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
    WITH CHECK (
      profile_id IN (
        SELECT id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    );

  -- Create trigger for updated_at
  CREATE OR REPLACE FUNCTION handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS set_dashboards_updated_at ON public.dashboards;
  CREATE TRIGGER set_dashboards_updated_at
    BEFORE UPDATE ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

END $$;