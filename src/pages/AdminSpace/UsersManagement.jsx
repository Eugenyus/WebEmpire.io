import React, { useState } from 'react';

export default function UsersManagement() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Users Management</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-[#1a1b2e] text-[#1a1b2e]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admins'
                ? 'border-[#1a1b2e] text-[#1a1b2e]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('admins')}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'users' ? (
          <h2 className="text-xl text-gray-700">Users List</h2>
        ) : (
          <h2 className="text-xl text-gray-700">Admins List</h2>
        )}
      </div>
    </div>
  );
}