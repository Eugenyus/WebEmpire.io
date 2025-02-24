import React from 'react';
import NavigationButtons from '../components/NavigationButtons';
import { formatCurrency } from '../utils/formatters';

const calculateEstimatedEarnings = (formData) => {
  // Base multipliers for different factors
  const timeMultipliers = {
    '2-5 hours/week': 0.6,
    '5-10 hours/week': 1,
    '10-20 hours/week': 1.5,
    '20-30 hours/week': 2,
    '30+ hours/week': 2.5
  };

  const skillMultipliers = {
    'beginner': 0.7,
    'intermediate': 1,
    'advanced': 1.3
  };

  // Calculate base earning from income goals
  const baseEarning = (formData.incomeMin + formData.incomeMax) / 2;
  
  // Apply multipliers
  const timeAdjusted = baseEarning * timeMultipliers[formData.timeCommitment];
  const finalEstimate = timeAdjusted * skillMultipliers[formData.skillLevel];

  return Math.round(finalEstimate / 100) * 100; // Round to nearest hundred
};

const getTaskDescription = (formData) => {
  const descriptions = {
    'affiliate': 'affiliate marketing campaigns could generate',
    'digital': 'completed digital product tasks could generate',
    'dropshipping': 'dropshipping store operations could generate',
    'nocode': 'no-code application development could generate',
    'trading': 'trading activities could generate'
  };

  return descriptions[formData.selectedInterest] || 'activities could generate';
};

export default function ResultPage({ formData, onRegenerate, onNext }) {
  const estimatedEarning = calculateEstimatedEarnings(formData);
  const averageBudget = (formData.budgetMin + formData.budgetMax) / 2;

  return (
    <div className="max-w-2xl">
      <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
        Your Passive Income Journey Starts Here!
      </h2>
      <p className="text-gray-600 text-lg mb-12">
        We're creating your blueprint based on the following details
      </p>

      <div className="mb-12">
        <h3 className="text-3xl font-bold text-[#1a1b2e] mb-4">
          Your earnings projection
        </h3>
        <p className="text-gray-600 text-lg mb-8">
          Estimate your potential earnings based on your plan and progress!
        </p>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-lg mb-4">Based on</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Time frame: {formData.timeCommitment}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none">
                    <path d="M12 6v12m-8-6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Budget: {formatCurrency(averageBudget)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Your estimated earning</h4>
              <div className="text-4xl font-bold">
                {formatCurrency(estimatedEarning)}<span className="text-lg font-normal text-gray-600">/month</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mt-4 text-center">
          *Your {getTaskDescription(formData)} {formatCurrency(estimatedEarning * 0.8)}/month with 50 sales at {formatCurrency(estimatedEarning * 0.016)} each.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onRegenerate}
          className="w-full py-3 px-6 rounded-lg border border-[#1a1b2e] text-[#1a1b2e] font-medium"
        >
          Regenerate
        </button>
        <button
          onClick={onNext}
          className="w-full py-3 px-6 rounded-lg bg-[#1a1b2e] text-white font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
}