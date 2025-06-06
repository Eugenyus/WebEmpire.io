import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export function useModules(activeDashboard) {
  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      if (!activeDashboard) return;

      try {
        const { data: modulesData, error: modulesError } = await supabase
          .from('roadmap_modules')
          .select('*')
          .eq('interest_area_id', activeDashboard.interest_area)
          .order('order_index');

        if (modulesError) throw modulesError;

        setModules(modulesData || []);
        if (modulesData?.length > 0) {
          setActiveModule(modulesData[0].id);
        }
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError(err.message);
      }
    };

    fetchModules();
  }, [activeDashboard]);

  return { modules, activeModule, error, setActiveModule };
}