import { useState } from 'react';
import { supabase } from '../config/supabase';

export const useDashboardManagement = (dashboards, setDashboards, setActiveDashboard) => {
  const [isAddingStream, setIsAddingStream] = useState(false);
  const [isDeletingDashboard, setIsDeletingDashboard] = useState(false);
  const [error, setError] = useState(null);

  const handleAddNewStream = async (selectedNewInterest, profile) => {
    // ... (existing logic for adding new stream)
  };

  const handleRemoveDashboard = async (activeDashboard) => {
    // ... (existing logic for removing dashboard)
  };

  return {
    isAddingStream,
    isDeletingDashboard,
    error,
    handleAddNewStream,
    handleRemoveDashboard,
  };
};