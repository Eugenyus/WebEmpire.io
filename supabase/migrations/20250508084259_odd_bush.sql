/*
  # Add price field to interest areas

  1. Changes
    - Add price column to interest_areas table
    - Add check constraint to ensure price is positive
    - Add default value of 0
*/

ALTER TABLE public.interest_areas
ADD COLUMN price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0);

-- Create index for better performance
CREATE INDEX idx_interest_areas_price ON interest_areas(price);