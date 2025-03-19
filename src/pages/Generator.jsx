import React, { useState } from 'react';
import Modal from '../components/Modal';
import SidebarLayout from '../components/layouts/SidebarLayout';
import ContentLayout from '../components/layouts/ContentLayout';
import SidebarItem from '../components/SidebarItem';
import DualRangeSlider from '../components/DualRangeSlider/DualRangeSlider';
import TimeCommitmentPage from './TimeCommitmentPage';
import BudgetPage from './BudgetPage';
import SkillLevelPage from './SkillLevelPage';
import InterestAreasPage from './InterestAreasPage';
import ResultPage from './ResultPage';
import RegistrationPage from './RegistrationPage';
import { MoneyIcon, TimeIcon, BudgetIcon, SkillIcon, InterestIcon, ResultIcon } from '../components/icons';

const initialFormData = {
  incomeMin: 5000,
  incomeMax: 15000,
  timeCommitment: '2-5 hours/week',
  budgetMin: 5000,
  budgetMax: 15000,
  skillLevel: 'intermediate',
  selectedInterest: '',
  orderId: ''
};

export default function Generator({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [showRegistration, setShowRegistration] = useState(false);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSidebarItemClick = (index) => {
    if (index < currentStep) {
      setCurrentStep(index);
    }
  };

  const handleRegenerate = () => {
    setFormData(initialFormData);
    setCurrentStep(0);
    setShowRegistration(false);
    onClose();
  };

  const handleContinueToRegistration = () => {
    setShowRegistration(true);
  };

  if (showRegistration) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <RegistrationPage 
          onCancel={handleRegenerate} 
          formData={formData}
          onClose={onClose}
        />
      </div>
    );
  }

  if (!isOpen) return null;

  const sidebarItems = [
    { title: 'Income Goal', subtitle: 'Set your income target', icon: <MoneyIcon /> },
    { title: 'Time Commitment', subtitle: 'Your time, your pace', icon: <TimeIcon /> },
    { title: 'Budget', subtitle: 'Share your budget', icon: <BudgetIcon /> },
    { title: 'Skill Level', subtitle: 'Your skills, your plan', icon: <SkillIcon /> },
    { title: 'Identification', subtitle: 'Order identification', icon: <InterestIcon /> },
    { title: 'Result', subtitle: 'Your tailored plan!', icon: <ResultIcon /> }
  ];

  const renderStep = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="max-w-2xl w-full">
            <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
              Define your income goal
            </h2>
            <p className="text-gray-600 text-lg">
              Think about how much extra income you'd like to earn within the next 6 months.
            </p>

            <DualRangeSlider 
              minValue={formData.incomeMin}
              maxValue={formData.incomeMax}
              onChange={(min, max) => setFormData(prev => ({ ...prev, incomeMin: min, incomeMax: max }))}
            />

            <div className="mt-12">
              <button
                onClick={handleNext}
                className="w-full bg-[#1a1b2e] text-white py-3 rounded-lg flex items-center justify-center space-x-2"
              >
                <span>Save And Continue</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        );
      case 1:
        return (
          <TimeCommitmentPage
            timeCommitment={formData.timeCommitment}
            onTimeChange={(value) => setFormData(prev => ({ ...prev, timeCommitment: value }))}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <BudgetPage
            budgetMin={formData.budgetMin}
            budgetMax={formData.budgetMax}
            onBudgetChange={(min, max) => setFormData(prev => ({ ...prev, budgetMin: min, budgetMax: max }))}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <SkillLevelPage
            skillLevel={formData.skillLevel}
            onSkillChange={(value) => setFormData(prev => ({ ...prev, skillLevel: value }))}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 4:
        return (
          <InterestAreasPage
            selectedInterest={formData.selectedInterest}
            orderId={formData.orderId}
            onInterestChange={(value, orderId) => setFormData(prev => ({ 
              ...prev, 
              selectedInterest: value,
              orderId: orderId
            }))}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 5:
        return (
          <ResultPage
            formData={formData}
            onRegenerate={handleRegenerate}
            onNext={handleContinueToRegistration}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="h-full flex flex-col lg:flex-row">
        {/* Steps Progress - Mobile */}
        <div className="lg:hidden bg-white border-b">
          <div className="px-5 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Step {currentStep + 1} of 6</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-5 pb-3 flex items-center gap-2">
            {sidebarItems.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full ${
                  index <= currentStep ? 'bg-[#1a1b2e]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Current Step Info - Mobile */}
        <div className="lg:hidden bg-white border-b px-5 py-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1a1b2e] rounded-lg flex items-center justify-center text-white">
              {sidebarItems[currentStep].icon}
            </div>
            <div>
              <h3 className="font-semibold">{sidebarItems[currentStep].title}</h3>
              <p className="text-sm text-gray-500">{sidebarItems[currentStep].subtitle}</p>
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <div className="hidden lg:w-80 lg:flex">
          <SidebarLayout>
            {sidebarItems.map((item, index) => (
              <SidebarItem
                key={index}
                {...item}
                active={index === currentStep}
                completed={index < currentStep}
                onClick={() => handleSidebarItemClick(index)}
                disabled={index > currentStep}
              />
            ))}
          </SidebarLayout>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="min-h-full flex items-center justify-center px-5 pt-[50px] pb-6 lg:p-0">
            <ContentLayout onClose={onClose} reducedPadding={currentStep >= 3}>
              {renderStep()}
            </ContentLayout>
          </div>
        </div>
      </div>
    </div>
  );
}