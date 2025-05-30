/*
  # Update column display name

  1. Changes
    - Update the comment on stripe_price_id column to display as "Stripe Product ID"
    - This changes how the column appears in the admin panel
*/

COMMENT ON COLUMN public.interest_areas.stripe_price_id IS 'Stripe Product ID';