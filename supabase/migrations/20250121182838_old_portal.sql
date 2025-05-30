-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own dashboard" ON public.dashboards;

-- Create new delete policy
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