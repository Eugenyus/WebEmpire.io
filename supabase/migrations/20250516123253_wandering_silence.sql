/*
  # Rename cf_product_id to stripe_price_id

  1. Changes
    - Rename cf_product_id column to stripe_price_id in interest_areas table
    - Update existing data to maintain price IDs
*/

ALTER TABLE public.interest_areas 
RENAME COLUMN cf_product_id TO stripe_price_id;