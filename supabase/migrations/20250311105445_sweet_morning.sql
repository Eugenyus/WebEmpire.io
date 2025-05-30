/*
  # Add ClickFunnels Token Fields to Settings

  1. Changes
    - Add `cf_access_token` column to store the OAuth access token
    - Add `cf_token_expires_at` column to track token expiration
    - Both fields are nullable since tokens are obtained after setup

  2. Notes
    - Using text type for token to accommodate various token formats
    - Using timestamptz for expiration to handle timezone differences
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'cf_access_token'
  ) THEN
    ALTER TABLE settings ADD COLUMN cf_access_token text;
    ALTER TABLE settings ADD COLUMN cf_token_expires_at timestamptz;
  END IF;
END $$;