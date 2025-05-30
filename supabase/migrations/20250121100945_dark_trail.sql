/*
  # Add delete policy for dashboards

  1. Changes
    - Add delete policy for dashboards table to allow users to delete their own dashboards
  
  2. Security
    - Only authenticated users can delete their own dashboards
    - Users can only delete dashboards linked to their profile
*/

DO $$ 
BEGIN
  -- Create delete policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dashboards' 
    AND policyname = 'Users can delete own dashboard'
  ) THEN
    CREATE POLICY "Users can delete own dashboard"
      ON public.dashboards
      FOR DELETE
      TO authenticated
      USING (
        profile_id IN (
          SELECT id FROM public.profiles 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;