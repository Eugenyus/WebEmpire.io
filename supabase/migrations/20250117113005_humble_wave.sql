/*
  # Restore Workspace Structure

  1. Changes
    - Ensure proper table structure for dashboards
    - Clean up any potential data inconsistencies
    - Recreate necessary constraints and policies
    - Fix relationship between profiles and dashboards

  2. Security
    - Re-enable RLS
    - Recreate all necessary policies
*/

DO $$ 
BEGIN
  -- Ensure proper table structure
  CREATE TABLE IF NOT EXISTS public.dashboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id),
    interest_area text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_profile_interest UNIQUE(profile_id, interest_area)
  );

  -- Enable RLS
  ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

  -- Recreate policies
  DO $policies$
  BEGIN
    -- Drop existing policies if they exist
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
  END $policies$;
END $$;