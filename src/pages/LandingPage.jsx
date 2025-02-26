import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Generator from './Generator';

export default function LandingPage() {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4 md:px-8 lg:px-[400px]">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl">
          Let's Design Your Personalized Passive Income Plan
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-12">
          Answer a few quick questions to get started.
        </p>
        <button 
          onClick={() => setIsGeneratorOpen(true)}
          className="w-full md:w-auto md:min-w-[300px] bg-primary text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-opacity-90 transition-colors"
        >
          Start Now
        </button>
      </main>
      <Generator isOpen={isGeneratorOpen} onClose={() => setIsGeneratorOpen(false)} />
    </div>
  );
}