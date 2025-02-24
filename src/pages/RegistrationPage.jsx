import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePassword } from '../utils/password';
import { generateConfirmationCode } from '../utils/confirmationCode';
import { supabase } from '../config/supabase';

export default function RegistrationPage({ onCancel, formData: registrationData, onClose }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: generatePassword(10)
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Generate confirmation code
      const confirmationCode = generateConfirmationCode();

      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      });

      if (signUpError) throw signUpError;

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          income_min: registrationData.incomeMin,
          income_max: registrationData.incomeMax,
          time_commitment: registrationData.timeCommitment,
          budget_min: registrationData.budgetMin,
          budget_max: registrationData.budgetMax,
          skill_level: registrationData.skillLevel,
          selected_interest: registrationData.selectedInterest,
          confirmation_code: confirmationCode
        });

      if (profileError) throw profileError;

      // 3. Create dashboard
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      const { error: dashboardError } = await supabase
        .from('dashboards')
        .insert({
          profile_id: profileData.id,
          interest_area: registrationData.selectedInterest
        });

      if (dashboardError) throw dashboardError;

      // 4. Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      // Close the modal and redirect to workspace
      onClose();
      navigate('/workspace');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white" style={{ paddingBottom: '10vh' }}>
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-xl border border-gray-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1a1b2e] mb-3">Almost there!</h1>
          <p className="text-gray-600">
            Enter your details to receive your personalized blueprint
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a1b2e] focus:border-[#1a1b2e]"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a1b2e] focus:border-[#1a1b2e]"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a1b2e] focus:border-[#1a1b2e]"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 px-8 rounded-lg border border-[#1a1b2e] text-[#1a1b2e] font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full py-3 px-8 rounded-lg bg-[#1a1b2e] text-white font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Generate my blueprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}