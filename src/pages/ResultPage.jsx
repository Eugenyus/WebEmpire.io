import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { supabase } from '../config/supabase';

export default function ResultPage({ formData, onRegenerate }) {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsChecking(true);

    try {
      // Validate fields
      if (!userInfo.fullName.trim() || !userInfo.email.trim()) {
        throw new Error('Please fill in both Full Name and Email fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInfo.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Convert email to lowercase for case-insensitive comparison
      const normalizedEmail = userInfo.email.toLowerCase();

      // Check if email exists in auth.users using case-insensitive comparison
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (userError) {
        throw new Error('Failed to check email availability');
      }

      if (existingUser) {
        throw new Error('This email address is already registered. Please use a different email or login to your existing account.');
      }

      if (!formData.selectedInterest?.stripe_price_id) {
        throw new Error('No interest area selected or invalid price ID');
      }

      // Store user info in session storage
      sessionStorage.setItem('registration_data', JSON.stringify({
        fullName: userInfo.fullName,
        email: normalizedEmail
      }));

      // Get the current URL for success/cancel redirects
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/thank-you-payment`;
      const cancelUrl = `${baseUrl}`;

      // Create checkout session with all form data
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          price_id: formData.selectedInterest.stripe_price_id,
          success_url: successUrl,
          cancel_url: cancelUrl,
          mode: 'payment',
          customer_email: normalizedEmail,
          full_name: userInfo.fullName,
          // Include all registration form data
          income_min: formData.incomeMin,
          income_max: formData.incomeMax,
          time_commitment: formData.timeCommitment,
          budget_min: formData.budgetMin,
          budget_max: formData.budgetMax,
          skill_level: formData.skillLevel,
          interest_area: formData.selectedInterest.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-2xl w-full">
      <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
        Your Plan Summary
      </h2>
      <p className="text-gray-600 text-lg mb-12">
        Review your personalized plan details before proceeding
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-[#1a1b2e] mb-6">Selected Interest Area</h3>
            <div className="bg-[#1a1b2e] text-white p-6 rounded-lg mb-4">
              <h4 className="text-lg font-semibold mb-2">{formData.selectedInterest?.title}</h4>
              <p className="text-gray-200 text-sm">{formData.selectedInterest?.description}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-2xl font-bold">{formatCurrency(formData.selectedInterest?.price || 0)}</span>
                <span className="text-gray-300 text-sm mb-1">one-time payment</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[#1a1b2e] mb-6">Plan Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Monthly Income Goal</h4>
                  <p className="text-gray-600">{formatCurrency(formData.incomeMin)} - {formatCurrency(formData.incomeMax)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Time Investment</h4>
                  <p className="text-gray-600">{formData.timeCommitment}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Investment Budget</h4>
                  <p className="text-gray-600">{formatCurrency(formData.budgetMin)} - {formatCurrency(formData.budgetMax)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Experience Level</h4>
                  <p className="text-gray-600 capitalize">{formData.skillLevel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
        <h3 className="text-xl font-semibold text-[#1a1b2e] text-left mb-6">Your Information</h3>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 text-left mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={userInfo.fullName}
              onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
              placeholder="Enter your full name"
            />
          </div>

          <div className="flex-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={userInfo.email}
              onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
              placeholder="Enter your email address"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onRegenerate}
          className="w-full py-3 px-6 rounded-lg border-2 border-[#1a1b2e] text-[#1a1b2e] font-medium hover:bg-gray-50 transition-colors"
        >
          Start Over
        </button>
        <button
          onClick={handleSubmit}
          disabled={isChecking}
          className="w-full py-3 px-6 rounded-lg bg-[#1a1b2e] text-white font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  );
}