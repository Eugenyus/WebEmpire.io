import { supabase } from '../config/supabase';

/**
 * Finds a profile by email address
 * @param {string} email - The email to search for
 * @returns {Promise<{success: boolean, profile: object|null, error: string|null}>}
 */
export const findProfileByEmail = async (email) => {
  try {
    if (!email) {
      return { success: false, profile: null, error: 'Email is required' };
    }

    // Search directly in the profiles table by email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle(); // Returns a single object or null

    if (error) {
      console.error('Error fetching profile by email:', error);
      return { success: false, profile: null, error: 'Error fetching profile' };
    }

    if (!profiles) {
      // If not found in profiles table, try to find in auth.users and then get the profile
      const { data: authUser, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (authError || !authUser) {
        return { success: false, profile: null, error: 'No user found with this email' };
      }

      // Get the profile using the user_id
      const { data: profileByUserId, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (profileError || !profileByUserId) {
        return { success: false, profile: null, error: 'No profile found for this email' };
      }

      // Update the profile with the email
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ email: email })
        .eq('id', profileByUserId.id);

      if (updateError) {
        console.error('Error updating profile with email:', updateError);
      }

      return { success: true, profile: profileByUserId, error: null };
    }

    return { success: true, profile: profiles, error: null };

  } catch (error) {
    console.error('Unexpected error finding profile by email:', error);
    return { success: false, profile: null, error: error.message };
  }
};