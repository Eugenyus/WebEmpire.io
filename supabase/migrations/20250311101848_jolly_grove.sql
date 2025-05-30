/*
  # Add ClickFunnels client fields to settings table

  1. Changes
    - Add `cf_client_id` column to settings table
    - Add `cf_client_secret` column to settings table

  2. Description
    This migration adds two new columns to store ClickFunnels client credentials:
    - cf_client_id: Stores the ClickFunnels client ID
    - cf_client_secret: Stores the ClickFunnels client secret
*/

DO $$ 
BEGIN
  -- Add cf_client_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'cf_client_id'
  ) THEN
    ALTER TABLE settings ADD COLUMN cf_client_id text;
  END IF;

  -- Add cf_client_secret column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'cf_client_secret'
  ) THEN
    ALTER TABLE settings ADD COLUMN cf_client_secret text;
  END IF;
END $$;