import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { getWelcomeEmailTemplate } from '../utils/emailTemplates';

export default function ConfirmationModal({ onConfirm }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('confirmation_code')
        .single();

      if (profileError) throw profileError;

      if (profile.confirmation_code === code.toUpperCase()) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ confirmation: 1 })
          .eq('confirmation_code', code.toUpperCase());

        if (updateError) throw updateError;
        
        onConfirm();
      } else {
        setError('Invalid confirmation code');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsResending(true);

    try {
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('confirmation_code')
        .single();

      if (profileError) throw profileError;

      // Get email template
      const { subject, html } = getWelcomeEmailTemplate(
        user.user_metadata?.full_name || 'User',
        profile.confirmation_code
      );

      // Send email using Supabase resetPasswordForEmail
      const { error: emailError } = await supabase.auth.resetPasswordForEmail(
        user.email,
        {
          data: {
            subject,
            template_data: {
              content: html
            }
          }
        }
      );

      if (emailError) throw emailError;

      // Show success message
      setError('Confirmation code has been resent to your email');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 modal-overlay">
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 max-w-2xl w-full mx-4 bg-white p-12 rounded-lg modal-box">
        <h2 className="text-3xl font-bold text-[#1a1b2e] mb-6 text-center">
          Confirm Your Account
        </h2>
        <p className="text-gray-600 mb-8 text-lg text-center">
          Please enter the confirmation code sent to your email address.
        </p>

        {error && (
          <div className={`mb-6 p-4 rounded-lg text-lg text-center ${
            error === 'Confirmation code has been resent to your email' 
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter confirmation code"
            className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full bg-[#1a1b2e] text-white py-4 rounded-lg font-medium text-lg disabled:opacity-50 mb-4"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Confirm Account'}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-[#1a1b2e] hover:text-[#8d78e1] transition-colors inline-flex items-center gap-2"
              disabled={isResending}
            >
              {isResending ? (
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
                  <span>Resending code...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Resend confirmation code</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}