/*
  # Create roadmap_to_user table

  1. New Tables
    - `roadmap_to_user`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to profiles)
      - `dashboard_id` (uuid, foreign key to dashboards)
      - `roadmap_id` (uuid, foreign key to roadmap_tasks)
      - `status` (text, with check constraint)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Users can only access their own records
*/

-- Create the roadmap_to_user table
CREATE TABLE public.roadmap_to_user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    roadmap_id uuid NOT NULL REFERENCES public.roadmap_tasks(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Create indexes for better query performance
CREATE INDEX idx_roadmap_to_user_profile ON public.roadmap_to_user(profile_id);
CREATE INDEX idx_roadmap_to_user_dashboard ON public.roadmap_to_user(dashboard_id);
CREATE INDEX idx_roadmap_to_user_roadmap ON public.roadmap_to_user(roadmap_id);

-- Enable Row Level Security
ALTER TABLE public.roadmap_to_user ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own roadmap progress"
    ON public.roadmap_to_user
    FOR SELECT
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own roadmap progress"
    ON public.roadmap_to_user
    FOR INSERT
    TO authenticated
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own roadmap progress"
    ON public.roadmap_to_user
    FOR UPDATE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own roadmap progress"
    ON public.roadmap_to_user
    FOR DELETE
    TO authenticated
    USING (
        profile_id IN (
            SELECT id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER set_roadmap_to_user_updated_at
    BEFORE UPDATE ON public.roadmap_to_user
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();