import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import supabaseClient, { supabase } from '../lib/supabase.js'

// Use the named export, fallback to default if needed
const client = supabase || supabaseClient

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [authStateLoaded, setAuthStateLoaded] = useState(false)
  
  // Use refs to prevent race conditions
  const authListenerRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const authUpdateInProgressRef = useRef(false);

  // Memoized fetchProfile function to prevent recreation on every render
  const fetchProfile = useCallback(async (userId) => {
    try {
      console.log('🔍 Fetching profile for user:', userId?.substring(0, 5) + '...');
      
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      console.log('✅ Profile fetched successfully');
      setProfile(data);
      return data
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
    }
  }, [])

  // Handle auth state updates in a controlled way
  const updateAuthState = useCallback(async (newSession) => {
    // Use a ref to prevent concurrent updates
    if (authUpdateInProgressRef.current) {
      console.log('⏳ Auth update already in progress, skipping');
      return;
    }
    
    try {
      authUpdateInProgressRef.current = true;
      
      // Only update if the state is actually different
      const currentUserId = session?.user?.id;
      const newUserId = newSession?.user?.id;
      
      if (currentUserId !== newUserId) {
        console.log('🔄 Updating auth state:', 
          currentUserId ? `User ${currentUserId.substring(0, 5)}... to ` : 'No user to ',
          newUserId ? `User ${newUserId.substring(0, 5)}...` : 'No user'
        );
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      } else if (newSession?.user) {
        // If user is the same but we might need to refresh profile
        console.log('🔄 Refreshing user profile');
        await fetchProfile(newSession.user.id);
      }
    } finally {
      authUpdateInProgressRef.current = false;
      setLoading(false);
    }
  }, [session, fetchProfile]);

  // Initial session loading and auth listener setup
  useEffect(() => {
    // Skip if we've already loaded
    if (hasLoadedRef.current) return;
    
    const loadInitialSession = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading initial session...');
        
        // First try to get the current session
        const { data, error } = await client.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          return;
        }
        
        console.log('📥 Initial session loaded:', data.session ? 'active' : 'none');
        
        // Update auth state with the session
        if (data.session) {
          await updateAuthState(data.session);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        
        hasLoadedRef.current = true;
        setAuthStateLoaded(true);
      } catch (error) {
        console.error('💥 Error in initial session load:', error);
        setLoading(false);
      }
    };
    
    // Setup auth listener to handle changes
    const setupAuthListener = () => {
      try {
        console.log('🎧 Setting up auth listener...');
        
        // Remove any existing listener
        if (authListenerRef.current) {
          authListenerRef.current.unsubscribe();
        }
        
        // Create new listener
        const { data } = client.auth.onAuthStateChange(async (event, newSession) => {
          console.log('🔔 Auth state change event:', event);
          
          // Skip TOKEN_REFRESHED events as they can cause refresh loops
          if (event === 'TOKEN_REFRESHED') {
            console.log('⏭️ Skipping token refresh event');
            return;
          }
          
          // Handle important auth events
          if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
            await updateAuthState(newSession);
          }
        });
        
        authListenerRef.current = data.subscription;
        console.log('✅ Auth listener setup complete');
      } catch (error) {
        console.error('❌ Error setting up auth listener:', error);
      }
    };
    
    // First load session, then setup listener
    loadInitialSession().then(setupAuthListener);
    
    // Cleanup function
    return () => {
      if (authListenerRef.current) {
        console.log('🧹 Cleaning up auth listener');
        authListenerRef.current.unsubscribe();
      }
    };
  }, [updateAuthState]);

  // Sign in with email/password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔑 Starting sign in for:', email);
      
      // First try to sign out to clear any existing session
      try {
        await client.auth.signOut();
        console.log('🧹 Cleaned up previous session');
      } catch (e) {
        console.warn('⚠️ Error in pre-signin cleanup:', e);
      }
      
      // Short delay to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now try to sign in
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Sign in failed:', error.message);
        throw error;
      }
      
      console.log('✅ Sign in successful');
      await updateAuthState(data.session);
      
      return { data, error: null };
    } catch (error) {
      console.error('💥 Sign in exception:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      console.log('🔐 Starting sign up for:', email);
      
      // First try to sign out to clear any existing session
      try {
        await client.auth.signOut();
        console.log('🧹 Cleaned up previous session');
      } catch (e) {
        console.warn('⚠️ Error in pre-signup cleanup:', e);
      }
      
      // Sign up with explicit options to prevent redirects
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: undefined,
          captchaToken: undefined
        }
      });
      
      if (error) {
        console.error('❌ Sign up failed:', error.message);
        throw error;
      }
      
      console.log('✅ Sign up successful');
      
      // Create/update profile and store user
      if (data?.user) {
        try {
          const timestamp = new Date().toISOString();
          const profileData = {
            id: data.user.id,
            email: data.user.email,
            full_name: userData.full_name || userData.fullName || '',
            role: userData.role || 'owner',
            updated_at: timestamp
          };
          
          // Check if profile exists
          const { data: existingProfile } = await client
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
          if (existingProfile) {
            // Update existing profile
            await client
              .from('profiles')
              .update(profileData)
              .eq('id', data.user.id);
          } else {
            // Create new profile
            await client
              .from('profiles')
              .insert([profileData]);
          }
          
          console.log('✅ Profile created/updated');
          
          // Always create a store for new users (even if no store name provided)
          const storeName = userData.store_name || userData.storeName || `${profileData.full_name}'s Store`;
          console.log('🏪 Creating or fetching store for user:', storeName);
          
          // First check if the user already has a store
          const { data: existingStores } = await client
            .from('stores')
            .select('id, name')
            .eq('name', storeName)
            .limit(1);
            
          let storeId;
          
          if (existingStores && existingStores.length > 0) {
            storeId = existingStores[0].id;
            console.log('✅ Using existing store:', storeId, existingStores[0].name);
          } else {
            // Create a new store
            const storeCode = storeName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
            console.log('🆕 Creating new store with code:', storeCode);
            
            const { data: newStore, error: storeError } = await client
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
              console.error('❌ Error creating store:', storeError);
              throw storeError;
            }
            
            storeId = newStore.id;
            console.log('✅ Created new store with ID:', storeId);
          }
          
          // Now add the user to store_users table - this is critical
          console.log('👤 Adding user to store_users table...');
          
          // First check if the user is already in store_users to avoid duplicates
          const { data: existingStoreUser } = await client
            .from('store_users')
            .select('id')
            .eq('user_id', data.user.id)
            .eq('store_id', storeId)
            .single();
            
          if (existingStoreUser) {
            console.log('ℹ️ User already in store_users table, skipping insertion');
          } else {
            // Insert the user into store_users
            const { error: storeUserError } = await client
              .from('store_users')
              .insert([{
                store_id: storeId,
                user_id: data.user.id,
                role: userData.role || 'owner',
                is_active: true,
                created_at: timestamp,
                updated_at: timestamp
              }]);
              
            if (storeUserError) {
              console.error('❌ Error adding user to store:', storeUserError);
              console.error('Error details:', JSON.stringify(storeUserError));
              throw storeUserError;
            }
            
            console.log('✅ User added to store_users table');
          }
          
          // Update the profile with the store_id
          await client
            .from('profiles')
            .update({ store_id: storeId })
            .eq('id', data.user.id);
            
          console.log('✅ Profile updated with store_id');
          
          // Double-check that the user was added to store_users
          const { data: verifyStoreUser, error: verifyError } = await client
            .from('store_users')
            .select('*')
            .eq('user_id', data.user.id)
            .eq('store_id', storeId);
            
          if (verifyError || !verifyStoreUser || verifyStoreUser.length === 0) {
            console.error('⚠️ Verification failed: User may not be in store_users table!', verifyError);
          } else {
            console.log('✅ Verified: User is in store_users table', verifyStoreUser);
          }
        } catch (profileError) {
          console.warn('⚠️ Error updating profile or store:', profileError);
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('💥 Sign up exception:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out...');
      
      const { error } = await client.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out failed:', error.message);
        throw error;
      }
      
      // Clear state
      setUser(null);
      setProfile(null);
      setSession(null);
      
      console.log('✅ Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('💥 Sign out exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      console.log('🔑 Requesting password reset for:', email);
      
      const { data, error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: undefined
      });
      
      if (error) {
        console.error('❌ Password reset request failed:', error.message);
        throw error;
      }
      
      console.log('✅ Password reset email sent');
      return { data, error: null };
    } catch (error) {
      console.error('💥 Password reset exception:', error);
      return { data: null, error };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      
      setLoading(true);
      console.log('📝 Updating profile for user:', user.id);
      
      const { data, error } = await client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Profile update failed:', error.message);
        throw error;
      }
      
      setProfile(data);
      console.log('✅ Profile updated successfully');
      
      return { data, error: null };
    } catch (error) {
      console.error('💥 Profile update exception:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Update user email or password
  const updateCredentials = async (credentials) => {
    try {
      setLoading(true);
      console.log('🔐 Updating user credentials');
      
      const { data, error } = await client.auth.updateUser(credentials);
      
      if (error) {
        console.error('❌ Credentials update failed:', error.message);
        throw error;
      }
      
      console.log('✅ Credentials updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('💥 Credentials update exception:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Return the auth context value
  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        authStateLoaded,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        updateCredentials
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
