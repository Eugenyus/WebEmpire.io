import React, { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../config/supabase';

export default function AddToCalendarModal({ isOpen, onClose, stepTitle, dashboardId, profileId }) {
  const [formData, setFormData] = useState({
    title: stepTitle,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // First check if this step is already in the calendar
      const { data: existingEntries } = await supabase
        .from('user_calendar')
        .select('*')
        .eq('profile_id', profileId)
        .eq('dashboard_id', dashboardId)
        .eq('title', formData.title);

      if (existingEntries?.length > 0) {
        throw new Error('This step is already added to your calendar');
      }

      // Add the step to calendar
      const { error: insertError } = await supabase
        .from('user_calendar')
        .insert({
          profile_id: profileId,
          dashboard_id: dashboardId,
          title: formData.title,
          description: formData.description,
          date: new Date(formData.date).toISOString()
        });

      if (insertError) throw insertError;
      onClose();
    } catch (err) {
      console.error('Error adding to calendar:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add to Calendar</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B46FE]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B46FE]"
              rows={3}
              placeholder="Add a description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B46FE]"
              required
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#6B46FE] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add to Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}