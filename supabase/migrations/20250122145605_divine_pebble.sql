/*
  # Create roadmap tasks table

  1. New Tables
    - `roadmap_tasks`
      - `id` (uuid, primary key)
      - `interest_area_id` (text, foreign key to interest_areas)
      - `title` (text)
      - `description` (text)
      - `order_index` (integer)
      - `status` (text)
      - `video_links` (jsonb array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create the roadmap_tasks table
CREATE TABLE public.roadmap_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    interest_area_id text REFERENCES public.interest_areas(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    order_index integer NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    video_links jsonb[] DEFAULT ARRAY[]::jsonb[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Create index for faster lookups
CREATE INDEX idx_roadmap_tasks_interest_area ON public.roadmap_tasks(interest_area_id);
CREATE INDEX idx_roadmap_tasks_order ON public.roadmap_tasks(interest_area_id, order_index);

-- Enable RLS
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access for authenticated users"
    ON public.roadmap_tasks
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert for admin users"
    ON public.roadmap_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow update for admin users"
    ON public.roadmap_tasks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow delete for admin users"
    ON public.roadmap_tasks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER set_roadmap_tasks_updated_at
    BEFORE UPDATE ON public.roadmap_tasks
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();