import React from 'react';

export default function NavigationButtons({ onBack, onNext, nextLabel = "Save And Continue", showBack = true, fullWidth = false }) {
  return (
    <div className={`flex justify-between items-center mt-12 w-full ${fullWidth ? 'space-x-4' : ''}`}>
      {showBack ? (
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="rotate-180">
            <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </button>
      ) : <div />}

      <button
        onClick={onNext}
        className={`
          flex items-center justify-center space-x-2 px-8 py-3 
          bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 
          ${fullWidth && !showBack ? 'w-full' : ''}
        `}
      >
        <span>{nextLabel}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}