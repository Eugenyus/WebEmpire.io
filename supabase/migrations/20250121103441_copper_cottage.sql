/*
  # Add dashboard relation

  1. Changes
    - Add dashboard_id column to dashboards table
    - Add self-referential foreign key constraint
    - Add index for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add dashboard_id column and foreign key constraint
ALTER TABLE public.dashboards
ADD COLUMN IF NOT EXISTS dashboard_id uuid REFERENCES public.dashboards(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_dashboards_dashboard_id ON public.dashboards(dashboard_id);