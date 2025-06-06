import React from 'react';

const NavigationItem = React.memo(({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-lg
      ${active ? 'bg-[#1a1b2e] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
  >
    <span className={`${active ? 'text-white' : 'text-gray-500'}`}>
      {icon}
    </span>
    <span className="font-medium">{label}</span>
  </button>
));

export default NavigationItem;