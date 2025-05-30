-- Drop the trigger and function that prevent last dashboard deletion
DROP TRIGGER IF EXISTS prevent_last_dashboard_deletion ON public.dashboards;
DROP FUNCTION IF EXISTS public.check_last_dashboard();