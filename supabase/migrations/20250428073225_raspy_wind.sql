/*
  # Add Modules Structure
  
  1. New Tables
    - `roadmap_modules`
      - `id` (uuid, primary key)
      - `interest_area_id` (text, foreign key to interest_areas)
      - `title` (text)
      - `order_index` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to roadmap_tasks
    - Remove direct reference to interest_area_id
    - Add module_id reference
    
  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create roadmap_modules table
CREATE TABLE public.roadmap_modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    interest_area_id text REFERENCES public.interest_areas(id) ON DELETE CASCADE,
    title text NOT NULL,
    order_index integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_roadmap_modules_interest_area ON public.roadmap_modules(interest_area_id);
CREATE INDEX idx_roadmap_modules_order ON public.roadmap_modules(order_index);

-- Enable RLS
ALTER TABLE public.roadmap_modules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access for authenticated users"
    ON public.roadmap_modules
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow insert for admin users"
    ON public.roadmap_modules
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
    ON public.roadmap_modules
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
    ON public.roadmap_modules
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
CREATE TRIGGER set_roadmap_modules_updated_at
    BEFORE UPDATE ON public.roadmap_modules
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add module_id to roadmap_tasks
ALTER TABLE public.roadmap_tasks
ADD COLUMN module_id uuid REFERENCES public.roadmap_modules(id) ON DELETE CASCADE;

-- Create index for the new column
CREATE INDEX idx_roadmap_tasks_module ON public.roadmap_tasks(module_id);

-- Create function to reorder modules
CREATE OR REPLACE FUNCTION reorder_roadmap_modules(
    module_id uuid,
    new_order integer,
    area_id text
)
RETURNS void AS $$
DECLARE
    old_order integer;
BEGIN
    -- Get the current order of the module
    SELECT order_index INTO old_order
    FROM public.roadmap_modules
    WHERE id = module_id;

    IF new_order > old_order THEN
        -- Moving down: update modules in between old and new position
        UPDATE public.roadmap_modules
        SET order_index = order_index - 1
        WHERE interest_area_id = area_id
        AND order_index > old_order
        AND order_index <= new_order;
    ELSE
        -- Moving up: update modules in between new and old position
        UPDATE public.roadmap_modules
        SET order_index = order_index + 1
        WHERE interest_area_id = area_id
        AND order_index >= new_order
        AND order_index < old_order;
    END IF;

    -- Update the module to its new position
    UPDATE public.roadmap_modules
    SET order_index = new_order
    WHERE id = module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reorder_roadmap_modules TO authenticated;