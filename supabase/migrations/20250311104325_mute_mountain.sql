/*
  # Add CF Product ID to Interest Areas

  1. Changes
    - Add `cf_product_id` column to `interest_areas` table
    - Column is nullable to maintain compatibility with existing records
    - Add index for faster lookups

  2. Notes
    - Using text type to accommodate various ID formats
    - Index added to improve query performance
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interest_areas' AND column_name = 'cf_product_id'
  ) THEN
    ALTER TABLE interest_areas ADD COLUMN cf_product_id text;
    CREATE INDEX idx_interest_areas_cf_product_id ON interest_areas(cf_product_id);
  END IF;
END $$;