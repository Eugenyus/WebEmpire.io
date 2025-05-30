/*
  # Add delete policy for dashboards table

  1. Security Changes
    - Add delete policy to allow authenticated users to delete their own dashboards
    - Users can only delete dashboards where they own the associated profile
*/

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