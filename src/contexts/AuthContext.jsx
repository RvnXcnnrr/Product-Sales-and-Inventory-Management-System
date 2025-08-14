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
  const authListenerRef = useRef(null)
  const hasLoadedRef = useRef(false)
  const authUpdateInProgressRef = useRef(false)
  const signingInRef = useRef(false)

  // Memoized fetchProfile function to prevent recreation on every render
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 -> no rows found (new user, trigger maybe not applied yet)
        if (error.code === 'PGRST116') {
          try {
            const { data: authUser } = await client.auth.getUser()
            const u = authUser?.user
            if (u) {
              const now = new Date().toISOString()
              const insertPayload = {
                id: u.id,
                email: u.email,
                full_name: u.user_metadata?.full_name || u.email,
                role: 'owner',
                created_at: now,
                updated_at: now,
                setup_complete: false
              }
              const { data: inserted, error: insErr } = await client
                .from('profiles')
                .insert([insertPayload])
                .select('*')
                .single()
              if (!insErr && inserted) {
                setProfile(inserted)
                return inserted
              }
              if (insErr && insErr.code !== '23505') { // ignore unique violation (race)
                console.error('Profile auto-insert failed:', insErr)
              }
            }
          } catch (ins) {
            console.error('Profile auto-create exception:', ins)
          }
          return null
        }
        console.error('Error fetching profile:', error)
        return null
      }

      setProfile(data)
      return data
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
    }
  }, [])

  // Handle auth state updates in a controlled way
  const updateAuthState = useCallback(async (newSession) => {
    if (authUpdateInProgressRef.current) return
    try {
      authUpdateInProgressRef.current = true
      // Always update session and user to keep tokens fresh in state
      setSession(newSession || null)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        await fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    } finally {
      authUpdateInProgressRef.current = false
      setLoading(false)
    }
  }, [fetchProfile])

  // Initial session loading and auth listener setup
  useEffect(() => {
    if (hasLoadedRef.current) return

    const loadInitialSession = async () => {
      try {
        setLoading(true)
        const { data, error } = await client.auth.getSession()
        if (error) {
          console.error('Error getting initial session:', error)
          return
        }
        if (data.session) {
          await updateAuthState(data.session)
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
        hasLoadedRef.current = true
        setAuthStateLoaded(true)
      } catch (error) {
        console.error('Error in initial session load:', error)
        setLoading(false)
      }
    }

    const setupAuthListener = () => {
      try {
        if (authListenerRef.current) {
          authListenerRef.current.unsubscribe()
        }

        const { data } = client.auth.onAuthStateChange(async (event, newSession) => {
          switch (event) {
            case 'TOKEN_REFRESHED':
            case 'SIGNED_IN':
            case 'USER_UPDATED':
            case 'INITIAL_SESSION':
              await updateAuthState(newSession)
              break
            case 'SIGNED_OUT':
              await updateAuthState(null)
              break
            default:
              // Ensure we never stay stuck in loading
              setLoading(false)
          }
        })
        authListenerRef.current = data.subscription
      } catch (error) {
        console.error('Error setting up auth listener:', error)
      }
    }

    loadInitialSession().then(setupAuthListener)
    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe()
      }
    }
  }, [updateAuthState])

  // Watchdog: if loading stays true for too long, clear it to prevent stuck spinners
  useEffect(() => {
    // Only apply watchdog during initial bootstrap to prevent interfering with user actions
    if (!loading || authStateLoaded) return
    const t = setTimeout(() => {
      if (loading && !authStateLoaded) {
        console.warn('[Auth] Loading stuck >8s, forcing clear')
        setLoading(false)
      }
    }, 8000)
    return () => clearTimeout(t)
  }, [loading, authStateLoaded])

  // Sign in with email/password
  const signIn = async (email, password) => {
    // Prevent overlapping sign-in attempts which can cause spurious 400s
    if (signingInRef.current) {
      return { data: null, error: new Error('Sign-in already in progress') }
    }
    try {
      signingInRef.current = true
      setLoading(true)
      const cleanEmail = (email || '').trim()
      const cleanPassword = (password || '').trim()
      if (!cleanEmail || !cleanPassword) {
        throw new Error('Email and password are required')
      }
      const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword })
      if (error) throw error
      await updateAuthState(data.session)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      signingInRef.current = false
      setLoading(false)
    }
  }

  // Register new user (DB trigger provisions profile/store/owner mapping)
  const signUp = async (email, password, userData) => {
    try {
      setLoading(true)
      try {
        await client.auth.signOut()
      } catch (e) {
        // ignore
      }
      const meta = {
        full_name: userData?.full_name || userData?.fullName || '',
        store_name: userData?.store_name || userData?.storeName || '',
        role: userData?.role || 'owner'
      }
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: meta, emailRedirectTo: undefined, captchaToken: undefined }
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

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
