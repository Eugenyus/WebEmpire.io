import { supabase } from '../config/supabase';

/**
 * Gets the ClickFunnels API configuration
 * @returns {Promise<{success: boolean, api_key?: string, workspace_id?: string, error?: string}>}
 */
const getClickFunnelsConfig = async () => {
  try {
    // Get the first settings record
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('cf_api_key, cf_workspace_id')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    if (!settings?.cf_api_key || !settings?.cf_workspace_id) {
      throw new Error('ClickFunnels API credentials not configured. Please contact an administrator.');
    }

    return {
      success: true,
      api_key: settings.cf_api_key,
      workspace_id: settings.cf_workspace_id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to get ClickFunnels configuration'
    };
  }
};

/**
 * Validates a ClickFunnels order by ID
 * @param {string} orderId - The order ID to validate
 * @returns {Promise<{success: boolean, exists: boolean, productId?: string, productName?: string, error?: string}>}
 */
export const validateClickFunnelsOrder = async (orderId) => {
  try {
    const config = await getClickFunnelsConfig();
    if (!config.success) {
      throw new Error(config.error);
    }

    // Make the API request to check the order
    const response = await fetch(`https://${config.workspace_id}.myclickfunnels.com/api/v2/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Accept': 'application/json'
      }
    });

    // Parse response data
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      // If response cannot be parsed as JSON
      if (response.status === 404) {
        return { success: true, exists: false };
      }
      throw new Error('Invalid response from ClickFunnels API');
    }

    // Handle error responses
    if (!response.ok) {
      if (response.status === 404) {
        return { success: true, exists: false };
      }
      throw new Error(responseData?.error || responseData?.message || `Failed to validate order: ${response.status}`);
    }

    // Get the original product ID from the first line item
    const product = responseData?.line_items?.[0]?.original_product;
    if (!product?.public_id) {
      throw new Error('Invalid order data: missing product information');
    }

    // Order exists and is valid
    return { 
      success: true, 
      exists: true,
      productId: product.public_id,
      productName: product.name || 'Unknown Product'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to validate ClickFunnels order'
    };
  }
};

/**
 * Checks if a product ID matches an interest area's cf_product_id
 * @param {string} productId - The ClickFunnels product ID to check
 * @returns {Promise<string>} The matching interest area ID or 'none' if no match found
 */
export const checkInterestArea = async (productId) => {
  try {
    if (!productId) return 'none';

    // Query interest areas to find a match
    const { data: interestArea, error } = await supabase
      .from('interest_areas')
      .select('id')
      .eq('cf_product_id', productId)
      .maybeSingle();

    if (error) {
      console.error('Error checking interest area:', error);
      return 'none';
    }

    // Return the matching interest area ID or 'none' if no match
    return interestArea?.id || 'none';
  } catch (error) {
    console.error('Error checking interest area:', error);
    return 'none';
  }
};

/**
 * Checks authentication with ClickFunnels API
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const authenticateClickFunnels = async () => {
  try {
    const config = await getClickFunnelsConfig();
    if (!config.success) {
      throw new Error(config.error);
    }

    // Make a test request to verify the API key works
    const response = await fetch(`https://${config.workspace_id}.myclickfunnels.com/api/v2/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      }
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      throw new Error('Invalid response from ClickFunnels API');
    }

    if (!response.ok) {
      throw new Error(responseData?.error_description || responseData?.error || `Authentication failed with status ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to authenticate with ClickFunnels'
    };
  }
};