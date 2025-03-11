import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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
        .select('id, cf_api_key')
        .single();

      if (error) throw error;

      if (data) {
        setApiKey(data.cf_api_key || '');
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
          .update({ cf_api_key: apiKey })
          .eq('id', settingsId);

        if (updateError) throw updateError;
      } else {
        // Create new settings
        const { error: insertError } = await supabase
          .from('settings')
          .insert([{ cf_api_key: apiKey }]);

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

        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Access Token
            </label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your ClickFunnels API Access Token"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpdateApiKey}
              className="px-4 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}