import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export default function EventModal({ isOpen, onClose, selectedDate, dashboardId, profileId, editData }) {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title,
        description: editData.description || ''
      });
    } else {
      setFormData({
        title: '',
        description: ''
      });
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const date = new Date(selectedDate);
      
      if (editData) {
        // Update existing event
        const { error: updateError } = await supabase
          .from('user_calendar')
          .update({
            title: formData.title,
            description: formData.description,
            date: date.toISOString()
          })
          .eq('id', editData.id);

        if (updateError) throw updateError;
      } else {
        // Create new event
        const { error: insertError } = await supabase
          .from('user_calendar')
          .insert({
            profile_id: profileId,
            dashboard_id: dashboardId,
            title: formData.title,
            description: formData.description,
            date: date.toISOString()
          });

        if (insertError) throw insertError;
      }

      onClose();
      setFormData({
        title: '',
        description: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-1">{editData ? 'Edit Task' : 'Add new Task'}</h2>

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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (editData ? 'Update Task' : 'Add Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}