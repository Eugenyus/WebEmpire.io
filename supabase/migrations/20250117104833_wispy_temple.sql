/*
  # Fix Dashboard Constraints - Final Version

  1. Changes
    - Remove unique constraint on profile_id
    - Allow multiple dashboards per profile
    - Maintain data integrity with composite unique constraint
    - Clean up any existing data issues

  2. Security
    - Maintains existing RLS policies
*/

-- Wrap everything in a transaction to ensure atomic execution
DO $$ 
BEGIN
  -- First remove the unique constraint if it exists
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
  -- Keep only the most recently created dashboard for each profile_id + interest_area combination
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
  -- This ensures a user can't have multiple dashboards for the same interest area
  -- while still allowing multiple dashboards per profile
  ALTER TABLE public.dashboards
  ADD CONSTRAINT unique_profile_interest 
  UNIQUE (profile_id, interest_area);

END $$;