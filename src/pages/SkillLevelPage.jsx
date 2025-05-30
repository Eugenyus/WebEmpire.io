import React from 'react';
import NavigationButtons from '../components/NavigationButtons';
import SkillOption from '../components/SkillLevel/SkillOption';

const skillLevels = [
  {
    id: 'beginner',
    title: 'Biggest Challenge',
    description: 'No prior experience with online income streams.'
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Some experience but need structured guidance.'
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Confident in implementing strategies independently.'
  }
];

export default function SkillLevelPage({ skillLevel, onSkillChange, onBack, onNext }) {
  return (
    <div className="max-w-2xl w-full">
      <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
        Define your skill level
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        Tell us about your expertise, and we'll customize a plan that matches your strengths!
      </p>

      <div className="space-y-4">
        {skillLevels.map((level) => (
          <SkillOption
            key={level.id}
            {...level}
            selected={skillLevel === level.id}
            onChange={onSkillChange}
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