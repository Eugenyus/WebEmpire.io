import { createClient } from '@supabase/supabase-js';

// Try to get stored credentials first
const getStoredCredentials = () => {
  try {
    const stored = localStorage.getItem('supabase_credentials');
    if (stored) {
      const { url, key } = JSON.parse(stored);
      if (url && key) return { url, key };
    }
    return null;
  } catch (error) {
    console.error('Error reading stored credentials:', error);
    return null;
  }
};

// Get credentials from environment or storage
const getCredentials = () => {
  const stored = getStoredCredentials();
  if (stored) return stored;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) {
    // Store for future use
    try {
      localStorage.setItem('supabase_credentials', JSON.stringify({ url, key }));
    } catch (error) {
      console.error('Error storing credentials:', error);
    }
    return { url, key };
  }

  throw new Error('Missing Supabase credentials');
};

const { url: supabaseUrl, key: supabaseAnonKey } = getCredentials();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);