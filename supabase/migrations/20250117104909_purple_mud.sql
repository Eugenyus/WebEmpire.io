/*
  # Remove All Dashboard Constraints
  
  1. Changes
    - Remove ALL constraints from dashboards table except primary key and foreign key
    - Allow true multiple dashboards per profile
    - No restrictions on interest areas

  2. Security
    - Maintains existing RLS policies
    - Keeps foreign key constraint for data integrity
*/

DO $$ 
BEGIN
  -- Drop ALL constraints except PK and FK
  ALTER TABLE public.dashboards
  DROP CONSTRAINT IF EXISTS unique_profile_id;
  
  ALTER TABLE public.dashboards
  DROP CONSTRAINT IF EXISTS unique_profile_interest;

END $$;