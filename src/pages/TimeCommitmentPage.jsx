import React from 'react';
import TimeSelector from '../components/TimeCommitment/TimeSelector';
import NavigationButtons from '../components/NavigationButtons';

export default function TimeCommitmentPage({ timeCommitment, onTimeChange, onBack, onNext }) {
  return (
    <div className="max-w-2xl w-full">
      <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
        Define your time commitment
      </h2>
      <p className="text-gray-600 text-lg mb-12">
        Estimate the time you can dedicate weekly to setting up and maintaining your income streams.
      </p>

      <TimeSelector 
        value={timeCommitment} 
        onChange={onTimeChange}
      />

      <NavigationButtons 
        onBack={onBack}
        onNext={onNext}
      />
    </div>
  );
}