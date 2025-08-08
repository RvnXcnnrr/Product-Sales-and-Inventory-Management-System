// Direct DB operations for the migration helper to fix user-store relationships

/**
 * Ensures a user is properly connected to a store in the store_users table
 * @param {object} supabase - Supabase client instance
 * @param {string} userId - The user's ID to connect
 * @param {string} storeId - The store ID to connect the user to
 * @param {string} role - User's role (owner, admin, staff)
 * @returns {Promise<object>} Result object with success/error info
 */
export const ensureUserInStore = async (supabase, userId, storeId, role = 'staff') => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!storeId) throw new Error('Store ID is required');
    
    // Check if the user-store relationship already exists
    const { data: existingMapping, error: checkError } = await supabase
      .from('store_users')
      .select('id')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected
      console.error('Error checking store_users:', checkError);
      return { 
        success: false, 
        error: checkError,
        message: `Failed to check if user is in store: ${checkError.message}`
      };
    }
    
    // If mapping already exists, just return success
    if (existingMapping) {
      return { 
        success: true, 
        created: false,
        message: 'User already connected to store'
      };
    }
    
    // Create the store_users record
    const timestamp = new Date().toISOString();
    const { error: insertError } = await supabase
      .from('store_users')
      .insert([{
        user_id: userId,
        store_id: storeId,
        role: role,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      }]);
      
    if (insertError) {
      console.error('Error inserting store_users:', insertError);
      return { 
        success: false, 
        error: insertError,
        message: `Failed to add user to store: ${insertError.message}`
      };
    }
    
    // Update the user's profile with the store_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ store_id: storeId })
      .eq('id', userId);
      
    if (updateError) {
      console.warn('Warning: Could not update profile with store_id:', updateError);
      // We don't fail completely here, as the critical part (store_users entry) worked
    }
    
    return { 
      success: true, 
      created: true,
      message: 'User successfully connected to store'
    };
  } catch (error) {
    console.error('Exception in ensureUserInStore:', error);
    return { 
      success: false, 
      error,
      message: `Exception connecting user to store: ${error.message}`
    };
  }
};

/**
 * Creates a store for a user if they don't have one
 * @param {object} supabase - Supabase client instance
 * @param {string} userId - User ID 
 * @param {string} storeName - Name for the store
 * @param {string} role - User's role in the store
 * @returns {Promise<object>} Result with store info and success status
 */
export const createStoreForUser = async (supabase, userId, storeName, role = 'owner') => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!storeName) throw new Error('Store name is required');
    
    const timestamp = new Date().toISOString();
    const storeCode = storeName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
    
    // Create the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert([{
        name: storeName,
        code: storeCode,
        created_at: timestamp,
        updated_at: timestamp
      }])
      .select()
      .single();
      
    if (storeError) {
      console.error('Error creating store:', storeError);
      return { 
        success: false, 
        error: storeError,
        message: `Failed to create store: ${storeError.message}`
      };
    }
    
    // Connect user to the new store
    const result = await ensureUserInStore(supabase, userId, store.id, role);
    
    return {
      ...result,
      store,
      storeId: store.id
    };
  } catch (error) {
    console.error('Exception in createStoreForUser:', error);
    return { 
      success: false, 
      error,
      message: `Exception creating store for user: ${error.message}`
    };
  }
};
