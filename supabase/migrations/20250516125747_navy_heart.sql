/*
  # Update column comment for stripe_price_id
  
  1. Changes
    - Update the comment on stripe_price_id column to display as "Stripe Product ID"
*/

COMMENT ON COLUMN public.interest_areas.stripe_price_id IS 'Stripe Product ID';