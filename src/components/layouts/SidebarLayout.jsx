import React from 'react';

export default function SidebarLayout({ children }) {
  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      <div className="p-6">
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}