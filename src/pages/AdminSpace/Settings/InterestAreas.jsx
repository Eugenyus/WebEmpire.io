import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';

export default function InterestAreas() {
  const [interestAreas, setInterestAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    cf_product_id: ''
  });

  useEffect(() => {
    fetchInterestAreas();
  }, []);

  const fetchInterestAreas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interest_areas')
        .select('*')
        .order('title');

      if (error) throw error;
      setInterestAreas(data || []);
    } catch (err) {
      console.error('Error fetching interest areas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate form data
      if (!formData.id || !formData.title || !formData.description) {
        throw new Error('Title and description are required');
      }

      // Format the ID
      const formattedId = formData.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      if (editingArea) {
        // Update existing interest area
        const { error: updateError } = await supabase
          .from('interest_areas')
          .update({
            title: formData.title,
            description: formData.description,
            cf_product_id: formData.cf_product_id || null
          })
          .eq('id', editingArea);

        if (updateError) throw updateError;
      } else {
        // Try to insert directly - the unique constraint will prevent duplicates
        const { error: insertError } = await supabase
          .from('interest_areas')
          .insert([{
            id: formattedId,
            title: formData.title,
            description: formData.description,
            cf_product_id: formData.cf_product_id || null
          }]);

        if (insertError) {
          // If error is about unique violation, provide a friendly message
          if (insertError.code === '23505') {
            throw new Error('An interest area with this ID already exists');
          }
          throw insertError;
        }
      }

      // Reset form and refresh data
      setFormData({ id: '', title: '', description: '', cf_product_id: '' });
      setIsEditing(false);
      setEditingArea(null);
      await fetchInterestAreas();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (area) => {
    setFormData({
      id: area.id,
      title: area.title,
      description: area.description,
      cf_product_id: area.cf_product_id || ''
    });
    setIsEditing(true);
    setEditingArea(area.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('interest_areas')
        .delete()
        .eq('id', deleteTarget);

      if (error) throw error;
      await fetchInterestAreas();
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ id: '', title: '', description: '', cf_product_id: '' });
    setIsEditing(false);
    setEditingArea(null);
    setError(null);
  };

  if (loading && !interestAreas.length) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Delete Interest Area</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this interest area? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Interest Areas</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#1a1b2e] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            Add New Interest Area
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="space-y-4">
            {!editingArea && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID (unique identifier)
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                  required
                  disabled={editingArea}
                  placeholder="e.g., web-development"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Use only lowercase letters, numbers, and hyphens. This will be used as a unique identifier.
                </p>
              </div>
            )}
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
                placeholder="e.g., Web Development"
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
                required
                placeholder="Enter a brief description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CF Product ID
              </label>
              <input
                type="text"
                value={formData.cf_product_id}
                onChange={(e) => setFormData({ ...formData, cf_product_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                placeholder="Enter ClickFunnels product ID..."
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#1a1b2e] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingArea ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-lg border">
        <div className="grid grid-cols-[1fr,2fr,1fr,auto] gap-4 p-4 border-b bg-gray-50 font-medium">
          <div>Title</div>
          <div>Description</div>
          <div>CF Product ID</div>
          <div className="w-24">Actions</div>
        </div>
        {interestAreas.map((area) => (
          <div key={area.id} className="grid grid-cols-[1fr,2fr,1fr,auto] gap-4 p-4 border-b last:border-0">
            <div>{area.title}</div>
            <div className="text-gray-600">{area.description}</div>
            <div className="text-gray-600">{area.cf_product_id || '-'}</div>
            <div className="flex items-center space-x-2 w-24">
              <button
                onClick={() => handleEdit(area)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113 .536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(area.id);
                  setShowDeleteModal(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}