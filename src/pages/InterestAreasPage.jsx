import React from 'react';
import NavigationButtons from '../components/NavigationButtons';
import InterestOption from '../components/InterestAreas/InterestOption';

const interestAreas = [
  {
    id: 'affiliate',
    title: 'Affiliate Marketing',
    description: 'Learn how to earn commissions by promoting products you love.'
  },
  {
    id: 'digital',
    title: 'Digital Products',
    description: 'Turn your ideas into income by crafting and selling digital products that inspire.'
  },
  {
    id: 'dropshipping',
    title: 'Dropshipping',
    description: 'Build a hassle-free online store—no inventory needed'
  },
  {
    id: 'nocode',
    title: 'No-Code Development',
    description: 'Build apps and websites effortlessly without writing a single line of code.'
  },
  {
    id: 'trading',
    title: 'Trading',
    description: 'Learn how to grow your income through smart investments tailored to your risk level.'
  }
];

export default function InterestAreasPage({ selectedInterest, onInterestChange, onBack, onNext }) {
  return (
    <div className="max-w-4xl w-full">
      <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
        Define your interest areas
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        Share what excites you, and we'll align your passive income plan with your passions!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {interestAreas.slice(0, 4).map((interest) => (
          <InterestOption
            key={interest.id}
            {...interest}
            selected={selectedInterest === interest.id}
            onChange={onInterestChange}
          />
        ))}
      </div>
      
      <div className="mb-8">
        {interestAreas.slice(4).map((interest) => (
          <InterestOption
            key={interest.id}
            {...interest}
            selected={selectedInterest === interest.id}
            onChange={onInterestChange}
          />
        ))}
      </div>

      <NavigationButtons 
        onBack={onBack}
        onNext={onNext}
      />
    </div>
  );
}