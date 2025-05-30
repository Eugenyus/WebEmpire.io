import React from 'react';

export default function TimeSelector({ value, onChange }) {
  const timeOptions = [
    '2-5 hours/week',
    '5-10 hours/week',
    '10-20 hours/week',
    '20-30 hours/week',
    '30+ hours/week'
  ];

  return (
    <div className="w-full">
      <label className="block text-left text-lg font-medium mb-2">
        Pick a time frame
      </label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {timeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}