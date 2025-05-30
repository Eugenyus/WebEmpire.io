import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, parseISO, isAfter, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../../config/supabase';
import EventModal from './EventModal';

export default function Calendar({ activeDashboardId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start from Monday
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;
        if (profile) {
          setProfileId(profile.id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!profileId || !activeDashboardId) return;

    fetchEvents();

    // Subscribe to calendar changes
    const channel = supabase
      .channel('calendar_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_calendar',
          filter: `profile_id=eq.${profileId} AND dashboard_id=eq.${activeDashboardId}`
        },
        handleCalendarChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, activeDashboardId, currentWeek]);

  const handleCalendarChange = (payload) => {
    const eventDate = parseISO(payload.new?.date || payload.old?.date);
    const isInCurrentWeek = weekDays.some(day => isSameDay(day, eventDate));

    if (!isInCurrentWeek) return;

    switch (payload.eventType) {
      case 'INSERT':
        setEvents(prev => [...prev, payload.new]);
        break;
      case 'DELETE':
        setEvents(prev => prev.filter(event => event.id !== payload.old.id));
        break;
      case 'UPDATE':
        setEvents(prev => prev.map(event => 
          event.id === payload.new.id ? payload.new : event
        ));
        break;
    }
  };

  const isEventInCurrentWeek = (event) => {
    const eventDate = parseISO(event.date);
    return weekDays.some(day => isSameDay(day, eventDate));
  };

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_calendar')
        .select('*')
        .eq('profile_id', profileId)
        .eq('dashboard_id', activeDashboardId)
        .gte('date', weekDays[0].toISOString())
        .lte('date', weekDays[6].toISOString());

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const getEventsForDate = (date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.date), date)
    );
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('user_calendar')
        .delete()
        .eq('id', deletingEvent.id);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setDeletingEvent(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  
  // Check if selected date is in the past
  const isSelectedDateValid = isAfter(startOfDay(selectedDate), startOfDay(new Date())) || 
                            isSameDay(selectedDate, new Date());

  if (isLoading && !events.length) {
    return (
      <div className="py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6B46FE] mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Delete Task</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingEvent(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Task Calendar</h2>
          <p className="text-sm text-gray-500 mt-1">Stay organized and on track</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="text-sm text-gray-500">
            {format(currentWeek, 'MMMM yyyy')}
          </div>
          <button 
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-6">
        {weekDays.map((date) => (
          <div 
            key={date.toString()} 
            className={`text-center cursor-pointer p-2 rounded-lg transition-colors
              ${isSameDay(date, selectedDate) 
                ? 'bg-[#1a1b2e] text-white' 
                : 'hover:bg-gray-50'}`}
            onClick={() => setSelectedDate(date)}
          >
            <div className="text-xs text-gray-500 mb-1">
              {format(date, 'EEE')}
            </div>
            <div className={`text-lg font-semibold ${
              isSameDay(date, selectedDate) ? 'text-white' : 'text-gray-900'
            }`}>
              {format(date, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Tasks for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {isSelectedDateValid && activeDashboardId && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="text-[#6B46FE] hover:text-[#5333D2] text-sm"
              data-add-task
            >
              + Add a Task
            </button>
          )}
        </div>

        <div className="space-y-2">
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event) => (
              <div 
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-[#6B46FE] rounded-full"></div>
                  <div>
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-gray-500">{event.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113 .536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setDeletingEvent(event);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tasks scheduled for this day
            </div>
          )}
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        selectedDate={selectedDate}
        dashboardId={activeDashboardId}
        profileId={profileId}
        editData={editingEvent}
      />
    </div>
  );
}