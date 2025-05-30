/*
  # Final Dashboard Table Fix

  1. Changes
    - Complete rebuild of dashboards table with correct structure
    - Remove all constraints and recreate only necessary ones
    - Clean migration with proper transaction handling
    - Proper RLS policies

  2. Security
    - Enable RLS
    - Add proper policies for authenticated users
    - Ensure data integrity with constraints
*/

BEGIN;

-- Disable RLS temporarily for the migration
ALTER TABLE public.dashboards DISABLE ROW LEVEL SECURITY;

-- Create new table with correct structure
CREATE TABLE public.dashboards_new (
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

-- Drop old table
DROP TABLE public.dashboards;

-- Rename new table
ALTER TABLE public.dashboards_new RENAME TO dashboards;

-- Add composite unique constraint
ALTER TABLE public.dashboards
ADD CONSTRAINT unique_profile_interest 
UNIQUE (profile_id, interest_area);

-- Enable RLS
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- Recreate policies
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_dashboards_updated_at
    BEFORE UPDATE ON public.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

COMMIT;