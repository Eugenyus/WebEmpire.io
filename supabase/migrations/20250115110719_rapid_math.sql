/*
  # Create dashboards table

  1. New Tables
    - `dashboards`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to profiles.id)
      - `interest_area` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `dashboards` table
    - Add policies for authenticated users to manage their own dashboard data
*/

CREATE TABLE IF NOT EXISTS public.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) NOT NULL,
  interest_area text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_profile_id UNIQUE(profile_id)
);

-- Enable Row Level Security
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger for updated_at
CREATE TRIGGER set_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();