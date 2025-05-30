/*
  # Consolidate dashboard table changes

  1. Changes
    - Removes unique_profile_id constraint
    - Adds unique_profile_interest constraint
    - Ensures RLS policies are properly set up
    - Cleans up any duplicate entries

  2. Security
    - Maintains existing RLS policies
    - Ensures table has RLS enabled
*/

DO $$ 
BEGIN
  -- Drop existing constraints
  ALTER TABLE public.dashboards
  DROP CONSTRAINT IF EXISTS unique_profile_id;
  
  ALTER TABLE public.dashboards
  DROP CONSTRAINT IF EXISTS unique_profile_interest;

  -- Clean up any duplicate entries
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY profile_id, interest_area 
             ORDER BY created_at DESC
           ) as rn
    FROM public.dashboards
  )
  DELETE FROM public.dashboards
  WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
  );

  -- Add new composite unique constraint
  ALTER TABLE public.dashboards
  ADD CONSTRAINT unique_profile_interest 
  UNIQUE (profile_id, interest_area);

  -- Ensure RLS is enabled
  ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

  -- Recreate RLS policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dashboards' 
    AND policyname = 'Users can view own dashboard'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dashboards' 
    AND policyname = 'Users can insert own dashboard'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dashboards' 
    AND policyname = 'Users can update own dashboard'
  ) THEN
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
  END IF;
END $$;