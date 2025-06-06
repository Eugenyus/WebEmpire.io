import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export function useDashboards(profileId) {
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [dashboardProgress, setDashboardProgress] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboards = async () => {
      if (!profileId) return;

      try {
        const { data: dashboardsData, error: dashboardsError } = await supabase
          .from('dashboards')
          .select('*')
          .eq('profile_id', profileId);

        if (dashboardsError) throw dashboardsError;

        if (dashboardsData && dashboardsData.length > 0) {
          setDashboards(dashboardsData);
          setActiveDashboard(dashboardsData[0]);
        }
      } catch (err) {
        console.error('Error fetching dashboards:', err.message);
        setError(err.message);
      }
    };

    fetchDashboards();
  }, [profileId]);

  const handleDashboardChange = (dashboard) => {
    setActiveDashboard(dashboard);
  };

  return {
    dashboards,
    activeDashboard,
    dashboardProgress,
    error,
    setDashboards,
    setActiveDashboard,
    setDashboardProgress,
    handleDashboardChange
  };
}