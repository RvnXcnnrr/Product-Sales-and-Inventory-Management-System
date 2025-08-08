import React, { createContext, useContext, useEffect, useState } from 'react'
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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await client.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Session error:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, userData) => {
    try {
      setLoading(true)
      console.log('🔐 AuthContext: Starting signUp with:', { email, userData })

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: userData, // metadata stored in auth.users.raw_user_meta_data
          emailRedirectTo: `${window.location.origin}/auth-callback`
        }
      })

      console.log('📋 AuthContext: Supabase signUp response:', { data, error })

      if (error) {
        console.error('❌ AuthContext: signUp error:', error)
        throw error
      }

      const newUser = data?.user
      if (newUser) {
        // Ensure profile row exists / is updated (trigger should insert basic row)
        try {
          // Try update first
            const profileUpdates = {
              full_name: userData.full_name || userData.fullName || null,
              role: userData.role || 'owner',
              // store_name is not a column in schema; ignore if present
              updated_at: new Date().toISOString()
            }

            const { error: updateErr } = await client
              .from('profiles')
              .update(profileUpdates)
              .eq('id', newUser.id)

            if (updateErr) {
              console.warn('Profile update failed, will attempt insert if row missing:', updateErr.message)
              // Check if row exists
              const { data: existingProfile, error: selectErr } = await client
                .from('profiles')
                .select('id')
                .eq('id', newUser.id)
                .single()
              if (selectErr) {
                console.warn('Profile select after failed update:', selectErr.message)
              }
              if (!existingProfile) {
                const { error: insertErr } = await client
                  .from('profiles')
                  .insert({ id: newUser.id, email, ...profileUpdates })
                if (insertErr) {
                  console.warn('Profile insert fallback failed:', insertErr.message)
                } else {
                  console.log('✅ Profile inserted fallback')
                }
              }
            } else {
              console.log('✅ Profile updated')
            }

          // Refresh local profile state
          await fetchProfile(newUser.id)
        } catch (pfErr) {
          console.warn('Profile post-signup handling error:', pfErr)
        }
      }

      console.log('✅ AuthContext: signUp successful')
      return { data, error: null }
    } catch (error) {
      console.error('💥 AuthContext: signUp exception:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await client.auth.signOut()
      
      if (error) {
        throw error
      }

      setUser(null)
      setProfile(null)
      setSession(null)
      
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      const { data, error } = await client.auth.resetPasswordForEmail(email)
      
      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { data: null, error }
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      setLoading(true)
      
      const { data, error } = await client
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    fetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
