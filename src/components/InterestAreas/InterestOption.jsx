import React from 'react';

export default function InterestOption({ id, title, description, selected, onChange }) {
  return (
    <div 
      className={`
        p-6 rounded-lg border cursor-pointer transition-all
        ${selected ? 'bg-[#1a1b2e] text-white border-[#1a1b2e]' : 'bg-white border-gray-200 hover:border-gray-300'}
      `}
      onClick={() => onChange(id)}
    >
      <div className="flex items-center space-x-3">
        <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center
          ${selected ? 'border-white' : 'border-gray-300'}
        `}>
          {selected && <div className="w-3 h-3 bg-white rounded-full" />}
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className={`text-sm ${selected ? 'text-gray-200' : 'text-gray-600'}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}