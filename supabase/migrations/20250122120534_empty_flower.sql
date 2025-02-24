-- First, disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Create materialized view for admin roles
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_roles AS
SELECT user_id
FROM public.profiles
WHERE role = 'admin';

CREATE UNIQUE INDEX IF NOT EXISTS admin_roles_user_id_idx ON admin_roles (user_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_admin_roles()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_roles;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
DROP TRIGGER IF EXISTS refresh_admin_roles_trigger ON public.profiles;
CREATE TRIGGER refresh_admin_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_admin_roles();

-- Create new policies using materialized view
CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR 
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR 
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid()
    OR 
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid()
    OR 
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- Initial refresh of materialized view
REFRESH MATERIALIZED VIEW admin_roles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;