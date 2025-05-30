import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { sendRegistrationEmail } from '../services/api';
import Logo from '../components/Logo';

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionId = searchParams.get('session_id')?.trim();

        if (!sessionId) {
          setError('No session ID provided.');
          setIsLoading(false);
          return;
        }

        // Fetch session data from Supabase
        const { data: session, error: sessionError } = await supabase
          .from('stripe_checkout_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (sessionError) throw sessionError;

        if (!session) {
          setError('Invalid or missing payment session.');
          setIsLoading(false);
          return;
        }

        // Verify session with Stripe
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-session?session_id=${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to validate session with Stripe.');
        }

        const stripeSession = await response.json();
        
        if (stripeSession.payment_status !== 'paid') {
          throw new Error('Payment not completed.');
        }

        setSessionData(session);
        setIsLoading(false);
      } catch (err) {
        console.error('Error verifying session:', err);
        setError(err.message || 'An error occurred while verifying your payment.');
        setIsLoading(false);
      }
    };

    verifySession();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      // Validate passwords
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Generate confirmation code
      const confirmationCode = Array.from({ length: 6 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
      ).join('');

      // Create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: sessionData.customer_email,
        password: password,
        options: {
          data: {
            full_name: sessionData.full_name
          }
        }
      });

      if (signUpError) throw signUpError;

      // Create profile with registration data
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          full_name: sessionData.full_name,
          email: sessionData.customer_email,
          role: 'user',
          confirmation: 0,
          confirmation_code: confirmationCode,
          income_min: sessionData.income_min,
          income_max: sessionData.income_max,
          time_commitment: sessionData.time_commitment,
          budget_min: sessionData.budget_min,
          budget_max: sessionData.budget_max,
          skill_level: sessionData.skill_level
        });

      if (profileError) throw profileError;

      // Get the profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      // Create dashboard
      const { error: dashboardError } = await supabase
        .from('dashboards')
        .insert({
          profile_id: profile.id,
          interest_area: sessionData.interest_area
        });

      if (dashboardError) throw dashboardError;

      // Send confirmation email
      const { success: emailSuccess, error: emailError } = await sendRegistrationEmail(
        sessionData.full_name,
        sessionData.customer_email,
        password,
        confirmationCode
      );

      if (!emailSuccess) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw here - we want to continue even if email fails
      }

      setRegistrationComplete(true);
      
      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: sessionData.customer_email,
        password: password
      });

      if (signInError) throw signInError;

      // Redirect to workspace after a short delay
      setTimeout(() => {
        navigate('/workspace');
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="bg-white border-b p-4">
          <Logo />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1b2e]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white border-b p-4">
        <Logo />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {error ? (
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600\" fill="none\" viewBox="0 0 24 24\" stroke="currentColor">
                  <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Payment Error</h1>
              <p className="text-red-600 mb-6 text-center">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-[#1a1b2e] text-white py-3 px-6 rounded-lg hover:bg-opacity-90"
              >
                Return Home
              </button>
            </div>
          ) : registrationComplete ? (
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Registration Complete!</h1>
              <p className="text-gray-600 mb-6 text-center">
                Your account has been created successfully. Please check your email for the confirmation code.
              </p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Registration</h1>
              <p className="text-gray-600 mb-6">
                Please set a password for your account to complete the registration process.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1a1b2e] text-white py-3 rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Creating your account...' : 'Complete Registration'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}