/*
  # Update admin column name display
  
  1. Changes
    - Add comment to stripe_price_id column to display as "Stripe Product ID"
*/

COMMENT ON COLUMN public.interest_areas.stripe_price_id IS 'Stripe Product ID';