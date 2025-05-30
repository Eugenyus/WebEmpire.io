import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { authenticateClickFunnels } from '../../services/clickfunnels';

export default function Settings() {
  const [formData, setFormData] = useState({
    workspaceId: '',
    clientId: '',
    clientSecret: '',
    apiKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [settingsId, setSettingsId] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('settings')
        .select('id, cf_workspace_id, cf_api_key, cf_client_id, cf_client_secret')
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          workspaceId: data.cf_workspace_id || '',
          clientId: data.cf_client_id || '',
          clientSecret: data.cf_client_secret || '',
          apiKey: data.cf_api_key || ''
        });
        setSettingsId(data.id);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateApiKey = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      if (settingsId) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('settings')
          .update({ 
            cf_workspace_id: formData.workspaceId,
            cf_client_id: formData.clientId,
            cf_client_secret: formData.clientSecret,
            cf_api_key: formData.apiKey 
          })
          .eq('id', settingsId);

        if (updateError) throw updateError;
      } else {
        // Create new settings
        const { error: insertError } = await supabase
          .from('settings')
          .insert([{ 
            cf_workspace_id: formData.workspaceId,
            cf_client_id: formData.clientId,
            cf_client_secret: formData.clientSecret,
            cf_api_key: formData.apiKey 
          }]);

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAuth = async () => {
    try {
      setIsChecking(true);
      setAuthStatus(null);
      setError(null);

      const { success, error } = await authenticateClickFunnels();

      if (!success) {
        throw new Error(error || 'Authentication failed');
      }

      setAuthStatus({
        success: true,
        message: 'Successfully authenticated with ClickFunnels'
      });
    } catch (err) {
      console.error('Authentication check error:', err);
      setAuthStatus({
        success: false,
        message: err.message || 'Failed to authenticate with ClickFunnels'
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* ClickFunnels API Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ClickFunnels API</h2>
        <p className="text-gray-600 mb-6">
          Configure your ClickFunnels API integration settings.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">
            Settings updated successfully!
          </div>
        )}

        {authStatus && (
          <div className={`mb-4 p-4 rounded-lg ${
            authStatus.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {authStatus.message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700 mb-1">
              Workspace ID
            </label>
            <input
              id="workspaceId"
              type="text"
              value={formData.workspaceId}
              onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
              placeholder="Enter your ClickFunnels Workspace ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              id="clientId"
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              placeholder="Enter your ClickFunnels Client ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
              Client Secret
            </label>
            <input
              id="clientSecret"
              type="text"
              value={formData.clientSecret}
              onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
              placeholder="Enter your ClickFunnels Client Secret"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Access Token
            </label>
            <input
              id="apiKey"
              type="text"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="Enter your ClickFunnels API Access Token"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCheckAuth}
              className="px-4 py-2 border border-[#1a1b2e] text-[#1a1b2e] rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              disabled={isChecking || isLoading}
            >
              {isChecking ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Check Authentication</span>
                </>
              )}
            </button>
            <button
              onClick={handleUpdateApiKey}
              className="px-4 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              disabled={isLoading || isChecking}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}