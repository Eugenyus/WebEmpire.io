import React from 'react';
import DualRangeSlider from '../components/DualRangeSlider/DualRangeSlider';
import NavigationButtons from '../components/NavigationButtons';

export default function BudgetPage({ budgetMin, budgetMax, onBudgetChange, onBack, onNext }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
        Define your budget
      </h2>
      <p className="text-gray-600 text-lg">
        This helps us recommend the best strategies and tools within your financial comfort zone.
      </p>

      <DualRangeSlider 
        minValue={budgetMin}
        maxValue={budgetMax}
        onChange={onBudgetChange}
      />

      <NavigationButtons 
        onBack={onBack}
        onNext={onNext}
      />
    </div>
  );
}