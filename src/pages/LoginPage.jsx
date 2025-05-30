import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { sendPasswordResetEmail } from '../services/api';
import Navbar from '../components/Navbar';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Sign in the user
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      // Get user's profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Redirect based on role
      if (profile.role === 'admin') {
        navigate('/adminspace');
      } else {
        navigate('/workspace');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSent(false);
    setIsLoading(true);

    try {
      if (!formData.email) {
        throw new Error('Please enter your email address');
      }

      // Send reset password email
      const { success, error: emailError } = await sendPasswordResetEmail(formData.email);

      if (!success) {
        throw new Error(emailError || 'Failed to send reset password email');
      }

      setResetSent(true);
      setError(null);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to send reset password email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1a1b2e] mb-3">Welcome Back!</h1>
            <p className="text-gray-600">Please enter your details to sign in</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg">
              Password reset instructions have been sent to your email.
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={showResetPassword ? handleResetPassword : handleSubmit}>
            <div className="space-y-4">
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

              {!showResetPassword && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a1b2e] focus:border-[#1a1b2e]"
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setShowResetPassword(!showResetPassword);
                  setError(null);
                  setResetSent(false);
                }}
                className="text-sm text-[#1a1b2e] hover:underline"
              >
                {showResetPassword ? 'Back to Login' : 'Forgot Password?'}
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (showResetPassword ? 'Reset Password' : 'Sign In')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}