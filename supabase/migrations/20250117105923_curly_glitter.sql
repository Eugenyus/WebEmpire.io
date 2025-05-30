/*
  # Final Dashboard Table Fix

  1. Changes
    - Drop ALL existing constraints
    - Recreate table with correct structure
    - Migrate existing data
    - Add correct constraints
    - Re-enable RLS

  2. Purpose
    - Allow multiple dashboards per profile
    - Prevent duplicate interest areas per profile
    - Preserve existing data
*/

DO $$ 
BEGIN
  -- Temporarily disable RLS
  ALTER TABLE public.dashboards DISABLE ROW LEVEL SECURITY;

  -- Create temporary table to store existing data
  CREATE TEMP TABLE temp_dashboards AS 
  SELECT * FROM public.dashboards;

  -- Drop existing table
  DROP TABLE public.dashboards;

  -- Recreate table with correct structure
  CREATE TABLE public.dashboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id),
    interest_area text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(profile_id, interest_area)
  );

  -- Restore data
  INSERT INTO public.dashboards (id, profile_id, interest_area, created_at, updated_at)
  SELECT DISTINCT ON (profile_id, interest_area) 
    id, profile_id, interest_area, created_at, updated_at
  FROM temp_dashboards
  ORDER BY profile_id, interest_area, created_at DESC;

  -- Re-enable RLS
  ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

  -- Recreate RLS policies
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

  -- Drop temporary table
  DROP TABLE temp_dashboards;
END $$;