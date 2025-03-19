import React, { useState } from 'react';
import NavigationButtons from '../components/NavigationButtons';
import { validateClickFunnelsOrder, checkInterestArea } from '../services/clickfunnels';

export default function InterestAreasPage({ selectedInterest, orderId: initialOrderId, onInterestChange, onBack, onNext }) {
  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  const handleContinue = async () => {
    try {
      setIsValidating(true);
      setError(null);

      // Validate order ID format
      if (!orderId.trim()) {
        throw new Error('Please enter an order ID');
      }

      // Validate the order ID with ClickFunnels
      const result = await validateClickFunnelsOrder(orderId.trim());

      if (!result.success) {
        throw new Error(result.error || 'Failed to validate order');
      }

      if (!result.exists) {
        throw new Error('This order ID is invalid.');
      }

      // Check if the product matches any interest area
      const interestAreaId = await checkInterestArea(result.productId);

      if (!interestAreaId || interestAreaId === 'none') {
        throw new Error('This order is not associated with any valid interest area');
      }

      // Set the interest area and continue
      onInterestChange(interestAreaId, orderId.trim());
      onNext();
    } catch (error) {
      console.error('Validation error:', error);
      setError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-2xl w-full">
      <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
        Enter your Order ID
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        Please enter your order ID to validate your purchase.
      </p>

      <div className="mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order ID
          </label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter your order ID"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e] focus:border-[#1a1b2e]"
          />

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      <NavigationButtons 
        onBack={onBack}
        onNext={handleContinue}
        nextLabel={isValidating ? 'Checking...' : 'Check and Continue'}
        fullWidth={true}
      />
    </div>
  );
}