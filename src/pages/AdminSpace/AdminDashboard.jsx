import React, { useState } from 'react';
import { sendTestEmail } from '../../services/api';
import { validateClickFunnelsOrder, checkInterestArea } from '../../services/clickfunnels';

export default function AdminDashboard() {
  const [testEmail, setTestEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  const handleTestEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await sendTestEmail(testEmail);
      setTestResult({
        success: result.success,
        message: result.success 
          ? 'Test email sent successfully! Please check your inbox.' 
          : result.error
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to send test email'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateOrder = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setOrderResult(null);

    try {
      // Validate order ID format
      if (!orderId.trim()) {
        throw new Error('Please enter an order ID');
      }

      // Call the validation function
      const result = await validateClickFunnelsOrder(orderId.trim());

      if (!result.success) {
        throw new Error(result.error || 'Failed to validate order');
      }

      if (!result.exists) {
        setOrderResult({
          success: true,
          message: 'Order does not exist in ClickFunnels'
        });
        return;
      }

      // Check if product matches any interest area
      const interestAreaId = await checkInterestArea(result.productId);

      setOrderResult({
        success: true,
        message: `The order exists and is related to product "${result.productName}" (${result.productId}) - interest area: ${interestAreaId}`
      });
    } catch (error) {
      setOrderResult({
        success: false,
        message: error.message || 'Failed to validate order ID'
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Testing Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Service Test</h2>
          <p className="text-gray-600 mb-6">
            Use this form to test the email service functionality.
          </p>

          <form onSubmit={handleTestEmail} className="space-y-4">
            <div>
              <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Test Email Address
              </label>
              <input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                required
              />
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {testResult.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !testEmail}
                className="px-4 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
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
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" fill="currentColor"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" fill="currentColor"/>
                    </svg>
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ClickFunnels Test Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ClickFunnels Test</h2>
          <p className="text-gray-600 mb-6">
            Enter an order ID to validate it.
          </p>

          <form onSubmit={handleValidateOrder} className="space-y-4">
            <div>
              <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">
                Order ID
              </label>
              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                required
              />
            </div>

            {orderResult && (
              <div className={`p-4 rounded-lg ${
                orderResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {orderResult.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isValidating || !orderId}
                className="px-4 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {isValidating ? (
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
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Validate Order</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}