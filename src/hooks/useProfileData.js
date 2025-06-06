import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';

export const useProfileData = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullName, setFullName] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [modules, setModules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          navigate('/login');
          return;
        }

        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, selected_interest, confirmation')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        if (profile) {
          setProfileId(profile.id);
          setIsConfirmed(profile.confirmation === 1);

          const { data: dashboardsData, error: dashboardsError } = await supabase
            .from('dashboards')
            .select('*')
            .eq('profile_id', profile.id);

          if (dashboardsError) throw dashboardsError;

          if (dashboardsData && dashboardsData.length > 0) {
            setDashboards(dashboardsData);
            setActiveDashboard(dashboardsData[0]);

            // Fetch modules for the active dashboard
            const { data: modulesData } = await supabase
              .from('roadmap_modules')
              .select('*')
              .eq('interest_area_id', dashboardsData[0].interest_area)
              .order('order_index');

            setModules(modulesData || []);
            if (modulesData?.length > 0) {
              setActiveModule(modulesData[0].id);
            }

            // Fetch calendar notifications
            const today = startOfDay(new Date());
            const { data: calendarItems, error: calendarError } = await supabase
              .from('user_calendar')
              .select('*')
              .eq('profile_id', profile.id)
              .lte('date', endOfDay(today).toISOString())
              .order('date');

            if (calendarError) throw calendarError;

            const sortedNotifications = (calendarItems || [])
              .map(item => ({
                ...item,
                isOverdue: isBefore(new Date(item.date), today)
              }))
              .sort((a, b) => {
                if (a.isOverdue && !b.isOverdue) return -1;
                if (!a.isOverdue && b.isOverdue) return 1;
                return new Date(a.date) - new Date(b.date);
              });

            setNotifications(sortedNotifications);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err.message);
        setError('Failed to load profile data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    getProfile();
  }, [navigate]);

  return {
    isLoading,
    error,
    fullName,
    isConfirmed,
    dashboards,
    activeDashboard,
    modules,
    notifications,
    profileId,
    setActiveDashboard,
    setModules,
    setNotifications,
    setIsConfirmed,
  };
};