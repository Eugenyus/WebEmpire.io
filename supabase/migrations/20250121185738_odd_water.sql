/*
  # Add delete policy for dashboards table using id

  1. Security Changes
    - Add delete policy to allow authenticated users to delete their own dashboards by id
    - Users can only delete dashboards where they own the associated profile
*/

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own dashboard" ON public.dashboards;

-- Create new delete policy using id
CREATE POLICY "Users can delete own dashboard"
ON public.dashboards
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = dashboards.profile_id 
    AND profiles.user_id = auth.uid()
    AND dashboards.id = dashboards.id
  )
);