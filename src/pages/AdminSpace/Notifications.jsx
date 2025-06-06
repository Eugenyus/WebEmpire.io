import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { format } from 'date-fns';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: 'global',
    user_id: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (showModal && formData.type === 'personal') {
      fetchUsers();
    }
  }, [showModal, formData.type, searchTerm]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch notifications without the join that's causing the error
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If we have notifications with user_ids, fetch the user details separately
      if (data && data.length > 0) {
        const userIds = data
          .filter(n => n.user_id && n.type === 'personal')
          .map(n => n.user_id);

        if (userIds.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .in('user_id', userIds);

          if (userError) throw userError;

          // Create a map of user_id to user data
          const userMap = {};
          userData.forEach(user => {
            userMap[user.user_id] = user;
          });

          // Attach user data to notifications
          data.forEach(notification => {
            if (notification.user_id && userMap[notification.user_id]) {
              notification.user = userMap[notification.user_id];
            }
          });
        }
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      if (searchTerm.length < 2) {
        setUsers([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .ilike('full_name', `%${searchTerm}%`)
        .order('full_name')
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // If the search field is cleared, also clear the user_id
    if (!e.target.value) {
      setFormData(prev => ({ ...prev, user_id: '' }));
    }
  };

  const handleUserSelect = (user) => {
    setFormData({ ...formData, user_id: user.user_id });
    setSearchTerm(user.full_name);
    // Clear the users array to hide the dropdown
    setUsers([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.description) {
        throw new Error('Message is required');
      }

      if (formData.type === 'personal' && !formData.user_id) {
        throw new Error('User selection is required for personal notifications');
      }

      // Prepare data for submission
      const notificationData = {
        type: formData.type,
        description: formData.description,
        status: 0
      };

      // Only include user_id for personal notifications
      if (formData.type === 'personal') {
        notificationData.user_id = formData.user_id;
      }

      // Insert notification
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (insertError) throw insertError;

      // Reset form and close modal
      setFormData({
        type: 'global',
        user_id: '',
        description: ''
      });
      setSearchTerm('');
      setUsers([]);
      setShowModal(false);

      // Refresh notifications list
      fetchNotifications();
    } catch (err) {
      console.error('Error creating notification:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      type: 'global',
      user_id: '',
      description: ''
    });
    setSearchTerm('');
    setUsers([]);
    setError(null);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#1a1b2e] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          Add New Notification
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg border">
        <div className="grid grid-cols-[1fr,1fr,2fr,1fr,auto] gap-4 p-4 border-b bg-gray-50 font-medium">
          <div>Type</div>
          <div>Recipient</div>
          <div>Message</div>
          <div>Date</div>
          <div className="w-24">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1b2e] mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No notifications found</div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="grid grid-cols-[1fr,1fr,2fr,1fr,auto] gap-4 p-4 border-b last:border-0 items-center">
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  notification.type === 'global' 
                    ? 'bg-blue-100 text-blue-800' 
                    : notification.type === 'personal'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {notification.type}
                </span>
              </div>
              <div>
                {notification.type === 'global' ? (
                  <span className="text-gray-500">All Users</span>
                ) : notification.user ? (
                  <div>
                    <div>{notification.user.full_name}</div>
                    <div className="text-xs text-gray-500">{notification.user.email}</div>
                  </div>
                ) : (
                  <span className="text-gray-500">Unknown</span>
                )}
              </div>
              <div className="truncate">{notification.description}</div>
              <div className="text-sm text-gray-500">
                {format(new Date(notification.created_at), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center space-x-2 w-24">
                <button 
                  title="Delete" 
                  onClick={() => handleDeleteNotification(notification.id)} 
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Notification</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
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
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      type: e.target.value,
                      // Reset user_id when switching to global
                      user_id: e.target.value === 'global' ? '' : formData.user_id
                    });
                    if (e.target.value === 'global') {
                      setSearchTerm('');
                      setUsers([]);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                >
                  <option value="global">Global</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              {formData.type === 'personal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search users..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                    />
                    {searchTerm.length >= 2 && users.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleUserSelect(user)}
                          >
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                  rows={4}
                  placeholder="Enter notification message..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}