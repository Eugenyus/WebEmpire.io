import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { startOfDay, endOfDay, isBefore } from 'date-fns';

export function useNotifications(profileId) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!profileId) return;

    const fetchNotifications = async () => {
      const today = startOfDay(new Date());
      const { data: calendarItems, error: calendarError } = await supabase
        .from('user_calendar')
        .select('*')
        .eq('profile_id', profileId)
        .lte('date', endOfDay(today).toISOString())
        .order('date');

      if (calendarError) {
        console.error('Error fetching notifications:', calendarError);
        return;
      }

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
    };

    fetchNotifications();

    // Subscribe to calendar changes
    const channel = supabase
      .channel('calendar_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_calendar',
          filter: `profile_id=eq.${profileId}`
        },
        handleCalendarChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const handleCalendarChange = (payload) => {
    // ... (implementation remains the same as in the original file)
  };

  return { notifications };
}