import React from 'react';

export default function SidebarItem({ icon: Icon, title, subtitle, active, completed, onClick, disabled }) {
  return (
    <div 
      className={`
        flex items-start space-x-4 p-4 
        ${active ? 'opacity-100' : 'opacity-60'}
        ${completed ? 'cursor-pointer hover:opacity-80' : disabled ? 'cursor-not-allowed' : 'cursor-default'}
      `}
      onClick={completed ? onClick : undefined}
    >
      <div className="relative">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${completed ? 'bg-green-600' : 'bg-[#1a1b2e]'}
        `}>
          {completed ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : Icon}
        </div>
        {/* Vertical line */}
        <div className="absolute left-1/2 top-full h-16 w-[1px] bg-gray-200 transform -translate-x-1/2" />
      </div>
      <div>
        <h3 className="font-semibold text-[#1a1b2e]">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}