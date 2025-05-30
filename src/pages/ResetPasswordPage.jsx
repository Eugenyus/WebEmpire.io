import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { validateResetToken, resetPassword } from '../utils/passwordReset';
import Navbar from '../components/Navbar';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setIsTokenChecked(true);
      setTokenError('No reset token provided. Please request a new password reset link.');
    }
  }, [location]);

  const validateToken = async (tokenToValidate) => {
    try {
      setIsLoading(true);
      const { valid, error: validationError } = await validateResetToken(tokenToValidate);
      
      setIsValidToken(valid);
      if (!valid) {
        setTokenError(validationError || 'Invalid or expired token. Please request a new password reset link.');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setTokenError('Failed to validate token. Please try again.');
      setIsValidToken(false);
    } finally {
      setIsTokenChecked(true);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      const { success, error: resetError } = await resetPassword(token, formData.password);
      
      if (!success) {
        throw new Error(resetError || 'Failed to reset password');
      }
      
      setIsSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (!isTokenChecked || isLoading) {
      return (
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1a1b2e] mb-3">Reset Password</h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1b2e]"></div>
            </div>
            <p className="mt-4 text-gray-600">Verifying your reset link...</p>
          </div>
        </div>
      );
    }

    if (!isValidToken) {
      return (
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1a1b2e] mb-3">Reset Password</h1>
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              {tokenError}
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1a1b2e] mb-3">Password Reset Successful</h1>
            <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
              Your password has been successfully reset. You will be redirected to the login page shortly.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1a1b2e] mb-3">Reset Your Password</h1>
          <p className="text-gray-600">Please enter your new password below</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a1b2e] focus:border-[#1a1b2e]"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        {renderContent()}
      </div>
    </div>
  );
}