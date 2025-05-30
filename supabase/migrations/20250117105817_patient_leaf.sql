/*
  # Fix Dashboard Table Constraints

  1. Changes
    - Remove unique constraint on profile_id to allow multiple dashboards per profile
    - Clean up any potential duplicate entries
    - Add composite unique constraint on profile_id and interest_area

  2. Purpose
    - Allow users to have multiple dashboards
    - Prevent duplicate interest areas for the same profile
*/

DO $$ 
BEGIN
  -- Remove the unique constraint on profile_id if it exists
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'unique_profile_id'
  ) THEN
    ALTER TABLE public.dashboards DROP CONSTRAINT unique_profile_id;
  END IF;

  -- Remove any existing unique constraint on profile_id and interest_area
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'unique_profile_interest'
  ) THEN
    ALTER TABLE public.dashboards DROP CONSTRAINT unique_profile_interest;
  END IF;

  -- Clean up any duplicate entries before adding the new constraint
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

  -- Add the new composite unique constraint
  ALTER TABLE public.dashboards
  ADD CONSTRAINT unique_profile_interest 
  UNIQUE (profile_id, interest_area);

END $$;