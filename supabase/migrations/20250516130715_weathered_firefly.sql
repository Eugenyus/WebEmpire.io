/*
  # Update stripe_price_id column display

  1. Changes
    - Update the comment on stripe_price_id column to display as "Stripe Price ID"
    - This changes how the column appears in the admin panel
*/

COMMENT ON COLUMN public.interest_areas.stripe_price_id IS 'Stripe Price ID';