import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { startOfDay, isBefore, isAfter } from 'date-fns';

export const useCalendarSubscription = (profileId, setNotifications) => {
  useEffect(() => {
    if (!profileId) return;

    const handleCalendarChange = (payload) => {
      const today = startOfDay(new Date());

      switch (payload.eventType) {
        case 'INSERT': {
          const newItem = {
            ...payload.new,
            isOverdue: isBefore(new Date(payload.new.date), today)
          };
          
          if (!isAfter(new Date(newItem.date), today)) {
            setNotifications(prev => {
              const newNotifications = [...prev, newItem].sort((a, b) => {
                if (a.isOverdue && !b.isOverdue) return -1;
                if (!a.isOverdue && b.isOverdue) return 1;
                return new Date(a.date) - new Date(b.date);
              });
              return newNotifications;
            });
          }
          break;
        }
        case 'DELETE':
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          break;
        case 'UPDATE': {
          const updatedItem = {
            ...payload.new,
            isOverdue: isBefore(new Date(payload.new.date), today)
          };
          
          setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== payload.new.id);
            if (!isAfter(new Date(updatedItem.date), today)) {
              filtered.push(updatedItem);
            }
            return filtered.sort((a, b) => {
              if (a.isOverdue && !b.isOverdue) return -1;
              if (!a.isOverdue && b.isOverdue) return 1;
              return new Date(a.date) - new Date(b.date);
            });
          });
          break;
        }
      }
    };

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
  }, [profileId, setNotifications]);
};