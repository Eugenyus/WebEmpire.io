import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { formatCurrency } from '../utils/formatters';
import NavigationButtons from '../components/NavigationButtons';

export default function InterestAreasPage({ selectedInterest, onInterestChange, onBack, onNext }) {
  const [interestAreas, setInterestAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInterestAreas();
  }, []);

  const fetchInterestAreas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('interest_areas')
        .select('*')
        .order('title');

      if (error) throw error;
      setInterestAreas(data || []);
    } catch (err) {
      console.error('Error fetching interest areas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedInterest) {
      setError('Please select an interest area');
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <div className="max-w-4xl w-full text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1b2e] mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full">
      <h2 className="text-4xl font-bold text-[#1a1b2e] mb-4">
        Choose your interest area
      </h2>
      <p className="text-gray-600 text-lg mb-8">
        Select the area that interests you the most to get started.
      </p>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interestAreas.map((area) => (
          <div
            key={area.id}
            onClick={() => onInterestChange(area)}
            className={`
              flex flex-col
              p-6 rounded-xl border-2 cursor-pointer transition-all
              ${selectedInterest?.id === area.id 
                ? 'bg-[#1a1b2e] text-white border-[#1a1b2e] transform scale-105' 
                : 'bg-white border-gray-200 hover:border-[#1a1b2e] hover:shadow-lg'
              }
            `}
          >
            <h3 className="font-bold text-xl mb-2">{area.title}</h3>
            <p className={`flex-1 text-sm mb-4 ${selectedInterest?.id === area.id ? 'text-gray-200' : 'text-gray-600'}`}>
              {area.description}
            </p>
            <div className={`
              text-center p-3 rounded-lg mt-auto
              ${selectedInterest?.id === area.id 
                ? 'bg-white bg-opacity-10' 
                : 'bg-[#1a1b2e] bg-opacity-5'
              }
            `}>
              <div className={`text-2xl font-bold ${selectedInterest?.id === area.id ? 'text-white' : 'text-[#1a1b2e]'}`}>
                {formatCurrency(area.price)}
              </div>
              <div className={selectedInterest?.id === area.id ? 'text-gray-200' : 'text-gray-600'}>
                One-time payment
              </div>
            </div>
          </div>
        ))}
      </div>

      <NavigationButtons 
        onBack={onBack}
        onNext={handleNext}
      />
    </div>
  );
}