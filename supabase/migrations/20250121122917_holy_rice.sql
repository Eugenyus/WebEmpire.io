-- Add delete policy for dashboards table
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