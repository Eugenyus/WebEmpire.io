/*
  # Fix Dashboard Table Constraints - Final Version

  1. Changes
    - Remove ALL existing constraints except primary key and foreign key
    - Add composite unique constraint on profile_id and interest_area
    - Clean up any duplicate entries

  2. Purpose
    - Allow multiple dashboards per profile
    - Prevent duplicate interest areas for the same profile
    - Ensure clean data state
*/

DO $$ 
BEGIN
  -- Drop ALL constraints except PK and FK
  DO $inner$ 
  BEGIN
    -- Drop unique_profile_id if it exists
    IF EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conname = 'unique_profile_id'
      AND conrelid = 'public.dashboards'::regclass
    ) THEN
      ALTER TABLE public.dashboards DROP CONSTRAINT unique_profile_id;
    END IF;

    -- Drop unique_profile_interest if it exists
    IF EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conname = 'unique_profile_interest'
      AND conrelid = 'public.dashboards'::regclass
    ) THEN
      ALTER TABLE public.dashboards DROP CONSTRAINT unique_profile_interest;
    END IF;
  END $inner$;

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

  -- Add the new composite unique constraint
  -- This ensures a user can't have multiple dashboards for the same interest area
  -- while still allowing multiple dashboards per profile
  ALTER TABLE public.dashboards
  ADD CONSTRAINT unique_profile_interest 
  UNIQUE (profile_id, interest_area);

END $$;