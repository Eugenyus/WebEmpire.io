-- Drop existing update policy
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- Create new update policy without using OLD reference
CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    -- Users can only update their own profile
    user_id = auth.uid()
    OR 
    -- Admins can update any profile
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    -- Users can only update their own profile
    user_id = auth.uid()
    OR 
    -- Admins can update any profile
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);