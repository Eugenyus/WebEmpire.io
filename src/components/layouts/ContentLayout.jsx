import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ContentLayout({ children, onClose, reducedPadding = false }) {
  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Close button - only visible on desktop */}
      <button 
        onClick={onClose}
        className="absolute left-4 top-4 p-2 border border-[#e8e9ed] rounded-full hidden lg:block"
      >
        <XMarkIcon className="w-4 h-4 text-[#151a2d]" />
      </button>

      <div className={`
        flex-1 
        px-5 lg:px-[250px] 
        pt-[25px] lg:pt-[100px] 
        flex justify-center
        ${reducedPadding ? 'lg:pt-[75px]' : ''}
      `}>
        <div className="text-center">
          {children}
        </div>
      </div>
    </div>
  );
}