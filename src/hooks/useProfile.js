import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export function useProfile() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [profileId, setProfileId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          navigate('/login');
          return;
        }

        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, selected_interest, confirmation')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        if (profile) {
          setProfileId(profile.id);
          setIsConfirmed(profile.confirmation === 1);
        }
      } catch (err) {
        console.error('Error loading profile:', err.message);
        setError('Failed to load profile data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    getProfile();
  }, [navigate]);

  return { fullName, isConfirmed, profileId, error, isLoading, setIsConfirmed };
}