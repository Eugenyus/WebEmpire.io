import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Generator from './Generator';

export default function LandingPage() {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-[400px]">
        <h1 className="text-5xl font-bold mb-6 max-w-3xl">
          Let's Design Your Personalized Passive Income Plan
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Answer a few quick questions to get started.
        </p>
        <button 
          onClick={() => setIsGeneratorOpen(true)}
          className="w-full bg-primary text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-colors"
        >
          Start Now
        </button>
      </main>
      <Generator isOpen={isGeneratorOpen} onClose={() => setIsGeneratorOpen(false)} />
    </div>
  );
}