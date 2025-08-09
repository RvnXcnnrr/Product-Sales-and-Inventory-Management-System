import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext({})

export const useNotifications = () => useContext(NotificationsContext)

export const NotificationsProvider = ({ children }) => {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.store_id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('store_id', profile.store_id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error) {
      setItems(data || [])
      setUnread((data || []).filter(n => !n.is_read).length)
    }
    setLoading(false)
  }, [profile?.store_id])

  useEffect(() => { load() }, [load])

  const markAllRead = async () => {
    if (!profile?.store_id) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('store_id', profile.store_id)
      .eq('is_read', false)
    if (!error) {
      setItems(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
    }
  }

  const add = async ({ title, message, type = 'info', data = {} }) => {
    if (!profile?.store_id || !profile?.id) return
    const payload = {
      store_id: profile.store_id,
      user_id: profile.id,
      title,
      message,
      type,
      data
    }
    const { data: row, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .single()
    if (!error && row) {
      setItems(prev => [row, ...prev])
      setUnread(u => u + 1)
    }
  }

  return (
    <NotificationsContext.Provider value={{ items, unread, loading, load, markAllRead, add }}>
      {children}
    </NotificationsContext.Provider>
  )
}
