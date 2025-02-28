import { supabase } from '../config/supabase';
import { findProfileByEmail } from './emailSync';

/**
 * Generates a random token for password reset
 * @returns {string} A random token
 */
export const generateResetToken = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const tokenLength = 32;
  let token = '';
  
  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters[randomIndex];
  }
  
  return token;
};

/**
 * Creates a password reset token for a user and updates it in the database
 * @param {string} email - The email of the user requesting password reset
 * @returns {Promise<{success: boolean, token: string|null, error: string|null}>}
 */
export const createPasswordResetToken = async (email) => {
  try {
    if (!email) {
      return { success: false, token: null, error: 'Email is required' };
    }

    // Find the profile by email using our helper function
    const { success, profile, error } = await findProfileByEmail(email);
    
    if (!success || !profile) {
      return { success: false, token: null, error: error || 'No user found with this email' };
    }

    // Generate a reset token
    const resetToken = generateResetToken();
    const now = new Date();

    // Update the profile with the reset token and timestamp
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        recovery_token: resetToken,
        recovery_sent_at: now.toISOString(),
        email: email // Ensure email is stored in the profile
      })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    return { success: true, token: resetToken, error: null };
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return { success: false, token: null, error: error.message };
  }
};

/**
 * Validates a password reset token
 * @param {string} token - The token to validate
 * @returns {Promise<{valid: boolean, profileId: string|null, email: string|null, error: string|null}>}
 */
export const validateResetToken = async (token) => {
  try {
    if (!token) {
      return { valid: false, profileId: null, email: null, error: 'Token is required' };
    }

    // Find the profile with this token
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, recovery_sent_at, email, user_id')
      .eq('recovery_token', token);

    if (profileError) throw profileError;
    
    if (!profiles || profiles.length === 0) {
      return { valid: false, profileId: null, email: null, error: 'Invalid or expired token' };
    }

    const profile = profiles[0];
    
    // Check if token is expired (24 hours)
    const sentAt = new Date(profile.recovery_sent_at);
    const now = new Date();
    const tokenAgeHours = (now - sentAt) / (1000 * 60 * 60);
    
    if (tokenAgeHours > 24) {
      return { valid: false, profileId: null, email: null, error: 'Token has expired' };
    }

    return { 
      valid: true, 
      profileId: profile.id, 
      email: profile.email,
      userId: profile.user_id,
      error: null 
    };
  } catch (error) {
    console.error('Error validating reset token:', error);
    return { valid: false, profileId: null, email: null, error: error.message };
  }
};

/**
 * Resets a user's password using a valid token
 * @param {string} token - The reset token
 * @param {string} newPassword - The new password
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const resetPassword = async (token, newPassword) => {
  try {
    // Use the new secure function to reset the password
    const { data, error } = await supabase.rpc('reset_user_password', {
      reset_token: token,
      new_password: newPassword
    });

    if (error) throw error;
    
    if (!data) {
      return { success: false, error: 'Invalid or expired token' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: error.message };
  }
};