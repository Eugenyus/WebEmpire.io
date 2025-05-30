/*
  # Add Safe Policies for Dashboards Table
  
  1. Changes
    - Add policies for dashboards table with existence checks
    - Policies allow users to manage their own dashboard data
*/

-- Add policies if they don't exist
DO $$ 
BEGIN
    -- Check and create view policy
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'dashboards' 
        AND policyname = 'Users can view own dashboard'
    ) THEN
        CREATE POLICY "Users can view own dashboard"
          ON public.dashboards
          FOR SELECT
          TO authenticated
          USING (
            profile_id IN (
              SELECT id FROM public.profiles 
              WHERE user_id = auth.uid()
            )
          );
    END IF;

    -- Check and create update policy
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'dashboards' 
        AND policyname = 'Users can update own dashboard'
    ) THEN
        CREATE POLICY "Users can update own dashboard"
          ON public.dashboards
          FOR UPDATE
          TO authenticated
          USING (
            profile_id IN (
              SELECT id FROM public.profiles 
              WHERE user_id = auth.uid()
            )
          )
          WITH CHECK (
            profile_id IN (
              SELECT id FROM public.profiles 
              WHERE user_id = auth.uid()
            )
          );
    END IF;

    -- Check and create insert policy
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'dashboards' 
        AND policyname = 'Users can insert own dashboard'
    ) THEN
        CREATE POLICY "Users can insert own dashboard"
          ON public.dashboards
          FOR INSERT
          TO authenticated
          WITH CHECK (
            profile_id IN (
              SELECT id FROM public.profiles 
              WHERE user_id = auth.uid()
            )
          );
    END IF;
END
$$;