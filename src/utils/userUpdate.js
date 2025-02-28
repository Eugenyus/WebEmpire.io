import { supabase } from '../config/supabase';

/**
 * Updates a user's email and/or phone in both auth.users and profiles tables
 * @param {string} userId - The user's UUID
 * @param {object} updates - Object containing email and/or phone to update
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateUserInfo = async (userId, updates = {}) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const { email, phone } = updates;
    
    // Allow updating either email, phone, or both
    // Remove the check that requires at least one to be provided
    
    // Call the Supabase function to update both tables
    const { data, error } = await supabase.rpc('update_user_info', {
      p_user_id: userId,
      new_email: email || null,
      new_phone: phone || null
    });

    if (error) throw error;
   
    return { 
      success: data, 
      error: data ? null : 'Failed to update user information'
    };
  } catch (err) {
    console.error('Error updating user info:', err);
    return { success: false, error: err.message };
  }
};