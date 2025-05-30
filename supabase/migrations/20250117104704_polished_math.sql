-- Remove the unique constraint on profile_id to allow multiple dashboards per profile
ALTER TABLE public.dashboards
DROP CONSTRAINT IF EXISTS unique_profile_id;

-- Add a unique constraint on profile_id and interest_area instead
-- This ensures a user can't have multiple dashboards for the same interest area
ALTER TABLE public.dashboards
ADD CONSTRAINT unique_profile_interest UNIQUE (profile_id, interest_area);