import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { updateUserInfo } from '../../utils/userUpdate';

export default function UsersManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, phone, role, full_name, created_at')
        .eq('role', activeTab === 'users' ? 'user' : 'admin')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      setUsers(profiles);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Update full_name in the profiles table
      if (formData.full_name !== editingUser.full_name) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ full_name: formData.full_name })
          .eq('id', editingUser.id);

        if (profileUpdateError) throw profileUpdateError;
      }

      // Always pass both email and phone to updateUserInfo
      // This ensures both fields are properly updated
      const { success, error: updateError } = await updateUserInfo(
        editingUser.user_id,
        {
          email: formData.email,
          phone: formData.phone
        }
      );

      if (!success) throw new Error(updateError || 'Failed to update user information');

      // Update password if provided
      if (formData.password) {
        const { error: passwordError } = await supabase.rpc('update_user_password', {
          user_id: editingUser.user_id,
          new_password: formData.password
        });

        if (passwordError) throw passwordError;
      }

      // Refresh users list
      await fetchUsers();
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Users Management</h1>
      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
      
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-[#1a1b2e] text-[#1a1b2e]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('users')}>Users</button>
          <button className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'admin' ? 'border-[#1a1b2e] text-[#1a1b2e]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('admin')}>Admins</button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border">
        <div className="grid grid-cols-[2fr,2fr,1fr,auto] gap-4 p-4 border-b bg-gray-50 font-medium">
          <div>Full Name</div>
          <div>Email</div>
          <div>Phone</div>
          <div className="w-24">Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1b2e] mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No {activeTab} found</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="grid grid-cols-[2fr,2fr,1fr,auto] gap-4 p-4 border-b last:border-0 items-center">
              <div>{user.full_name || 'N/A'}</div>
              <div>{user.email || 'N/A'}</div>
              <div>{user.phone || 'N/A'}</div>
              <div className="flex items-center space-x-2 w-24">
                <button 
                  title="Edit" 
                  onClick={() => handleEdit(user)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113 .536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  title="Delete" 
                  onClick={() => handleDelete(user.user_id)} 
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                  minLength={6}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}