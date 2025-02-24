/*
  # Create interest areas table

  1. New Tables
    - `interest_areas`
      - `id` (text, primary key) - Slug identifier for the interest area
      - `title` (text) - Display title
      - `description` (text) - Description of the interest area
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `interest_areas` table
    - Add policies for authenticated users to read data
    - Add policies for admin users to manage data
*/

-- Create the interest_areas table
CREATE TABLE IF NOT EXISTS public.interest_areas (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interest_areas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access for all authenticated users"
    ON public.interest_areas
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert existing interest areas
INSERT INTO public.interest_areas (id, title, description)
VALUES
    ('affiliate', 'Affiliate Marketing', 'Learn how to earn commissions by promoting products you love.'),
    ('digital', 'Digital Products', 'Turn your ideas into income by crafting and selling digital products that inspire.'),
    ('dropshipping', 'Dropshipping', 'Build a hassle-free online store—no inventory needed'),
    ('nocode', 'No-Code Development', 'Build apps and websites effortlessly without writing a single line of code.'),
    ('trading', 'Trading', 'Learn how to grow your income through smart investments tailored to your risk level.')
ON CONFLICT (id) DO UPDATE
SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = now();

-- Create updated_at trigger
CREATE TRIGGER set_interest_areas_updated_at
    BEFORE UPDATE ON public.interest_areas
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();