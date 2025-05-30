/*
  # Add ClickFunnels Workspace ID to settings

  1. Changes
    - Add cf_workspace_id column to settings table
    
  2. Notes
    - Makes the field nullable to maintain compatibility with existing records
    - Uses text type to accommodate any format of workspace ID
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'cf_workspace_id'
  ) THEN
    ALTER TABLE settings ADD COLUMN cf_workspace_id text;
  END IF;
END $$;