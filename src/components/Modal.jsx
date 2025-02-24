import React from 'react';

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="h-full flex">
        {/* Sidebar */}
        <div className="w-80">
          {children[0]}
        </div>
        {/* Main Content */}
        <div className="flex-1">
          {children[1]}
        </div>
      </div>
    </div>
  );
}