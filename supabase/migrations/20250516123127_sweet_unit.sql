/*
  # Update interest areas with Stripe price IDs
  
  1. Changes
    - Update existing interest areas with their corresponding Stripe price IDs
*/

UPDATE public.interest_areas 
SET cf_product_id = 'price_1RPMUPFRTL7MRvIhgFE1fxre'
WHERE id = 'trading';

UPDATE public.interest_areas 
SET cf_product_id = 'price_1RPMUCFRTL7MRvIhCEpNEaFZ'
WHERE id = 'nocode';

UPDATE public.interest_areas 
SET cf_product_id = 'price_1RPMTIFRTL7MRvIhWTyH0912'
WHERE id = 'dropshipping';

UPDATE public.interest_areas 
SET cf_product_id = 'price_1RPMT2FRTL7MRvIhFQM5fas2'
WHERE id = 'digital';

UPDATE public.interest_areas 
SET cf_product_id = 'price_1RPL4qFRTL7MRvIhM0TV79Wk'
WHERE id = 'affiliate';