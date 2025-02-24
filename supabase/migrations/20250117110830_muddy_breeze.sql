/*
  # Fix dashboard constraints

  1. Changes
    - Remove the unique constraint on profile_id
    - Add a composite unique constraint on profile_id and interest_area
    - Clean up any existing duplicate entries
  
  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity with proper constraints
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
END $$;