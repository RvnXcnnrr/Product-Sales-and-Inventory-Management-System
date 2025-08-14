import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import supabase from '../../lib/supabase'
import toast from 'react-hot-toast'

const currencyOptions = [
  { code: 'PHP', label: 'PHP - Philippine Peso (₱)', symbol: '₱' },
  { code: 'USD', label: 'USD - US Dollar ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR - Euro (€)', symbol: '€' }
]

const timezoneOptions = [
  'UTC', 'Asia/Manila', 'Asia/Singapore', 'Asia/Hong_Kong', 'America/New_York', 'Europe/London'
]

const phoneRegex = /^$|^(\+?63|0)9\d{9}$/ // basic PH mobile validation (allows empty)

const InitialSetupGate = ({ children }) => {
  const { user, profile, updateProfile, loading } = useAuth()
  const [storeSetupOpen, setStoreSetupOpen] = useState(false)
  const [profileSetupOpen, setProfileSetupOpen] = useState(false)
  const [storeForm, setStoreForm] = useState({
  name: '',
  code: '',
  email: '',
    phone: '',
    currency: 'PHP',
    timezone: 'UTC',
    address: '',
    tax_rate: '0',
    receipt_footer: 'Thank you for your purchase!'
  })
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    job_title: '',
    address: ''
  })
  const [savingStore, setSavingStore] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const profileNameRef = useRef(null)
  const storeNameRef = useRef(null)
  const [storeStepDone, setStoreStepDone] = useState(false)
  const STORE_FLAG_KEY = user?.id ? `initialSetup:${user.id}:storeDone` : null
  useEffect(() => {
    if (loading || !user || !profile || profile.setup_complete) return
    const localFlag = STORE_FLAG_KEY ? localStorage.getItem(STORE_FLAG_KEY) === '1' : false
    // Immediate optimistic prefill from metadata/profile before any store fetch to avoid blank fields
    setStoreForm(prev => ({
      ...prev,
      name: prev.name || user.user_metadata?.store_name || user.user_metadata?.storeName || '',
      email: prev.email || user.email || '',
    }))
    setProfileForm(prev => ({
      ...prev,
      full_name: prev.full_name || profile.full_name || user.user_metadata?.full_name || user.user_metadata?.fullName || '',
    }))
    if (localFlag && !storeStepDone) {
      setStoreStepDone(true)
    }
    const initialize = async () => {
      try {
        // If store step already done (flag/local), go straight to profile setup
        if (storeStepDone || localFlag) {
          if (!profileSetupOpen) {
            setProfileSetupOpen(true)
            setTimeout(() => profileNameRef.current && profileNameRef.current.focus(), 40)
          }
          return
        }
        // If profile has a store_id, attempt to fetch store and decide if step can be skipped
        if (profile.store_id) {
          const { data: store } = await supabase.from('stores').select('*').eq('id', profile.store_id).maybeSingle()
          if (store) {
            setStoreForm(f => ({
              ...f,
              name: store.name || f.name,
              code: store.code || f.code,
              email: store.email || f.email || user.email || '',
              phone: store.phone || f.phone,
              currency: store.currency || f.currency,
              timezone: store.timezone || f.timezone,
              address: store.address || f.address,
              tax_rate: store.tax_rate != null ? String(store.tax_rate) : f.tax_rate,
              receipt_footer: store.receipt_footer || f.receipt_footer
            }))
            if (store.name && store.code && store.email) {
              // Treat as completed
              setStoreStepDone(true)
              if (STORE_FLAG_KEY) localStorage.setItem(STORE_FLAG_KEY, '1')
              setProfileSetupOpen(true)
              setTimeout(() => profileNameRef.current && profileNameRef.current.focus(), 40)
              return
            }
          }
        }
        // Otherwise open store setup
        if (!storeSetupOpen) {
          setStoreSetupOpen(true)
          setTimeout(() => storeNameRef.current && storeNameRef.current.focus(), 40)
        }
      } catch (e) {
        console.error('Store prefill failed', e)
        setStoreSetupOpen(true)
      }
    }
    // Only run if neither modal currently open (avoid flicker)
    if (!storeSetupOpen && !profileSetupOpen) {
      initialize()
    }
  }, [loading, user, profile, storeStepDone, profileSetupOpen, storeSetupOpen, STORE_FLAG_KEY])
  const validateStore = () => {
    if (!storeForm.name.trim()) return 'Store Name is required'
    if (!storeForm.code.trim()) return 'Store Code is required'
    if (!storeForm.email.trim()) return 'Contact Email is required'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(storeForm.email)) return 'Invalid contact email'
    if (storeForm.phone && !phoneRegex.test(storeForm.phone)) return 'Invalid phone number'
    if (!storeForm.currency) return 'Currency required'
    if (!storeForm.timezone) return 'Timezone required'
    if (storeForm.tax_rate !== '' && isNaN(parseFloat(storeForm.tax_rate))) return 'Tax rate must be a number'
    return null
  }

  const saveStore = async () => {
    if (savingStore) return
    const err = validateStore()
    if (err) { toast.error(err); return }
    setSavingStore(true)
    try {
      let storeId = profile.store_id
      const payload = {
        name: storeForm.name.trim(),
        code: storeForm.code.trim(),
        email: storeForm.email.trim(),
        phone: storeForm.phone.trim() || null,
        currency: storeForm.currency,
        timezone: storeForm.timezone,
        address: storeForm.address.trim() || null,
        tax_rate: storeForm.tax_rate === '' ? 0 : parseFloat(storeForm.tax_rate),
        receipt_footer: storeForm.receipt_footer || 'Thank you for your purchase!'
      }
      if (!storeId) {
        const { data: inserted, error } = await supabase.from('stores').insert([payload]).select().single()
        if (error) {
          // If RLS prevents insert, attempt to find existing mapping (trigger may have already created a store)
          if (error.code === '42501') {
            console.warn('[Setup] Store insert blocked by RLS, attempting to reuse existing mapping')
            // Attempt RPC fallback if available
            try {
              const rpcPayload = {
                p_name: payload.name,
                p_code: payload.code,
                p_email: payload.email,
                p_phone: payload.phone,
                p_currency: payload.currency,
                p_timezone: payload.timezone,
                p_address: payload.address,
                p_tax_rate: payload.tax_rate,
                p_receipt_footer: payload.receipt_footer
              }
              const { data: rpcId, error: rpcErr } = await supabase.rpc('create_store_for_user', rpcPayload)
              if (!rpcErr && rpcId) {
                storeId = rpcId
                await updateProfile({ store_id: storeId })
                toast.success('Store created')
              } else if (rpcErr) {
                console.warn('[Setup] RPC create_store_for_user failed:', rpcErr)
              }
            } catch (rpcCatch) {
              console.warn('[Setup] RPC exception:', rpcCatch)
            }
            if (!storeId) {
            const { data: existingMap, error: mapErr } = await supabase
              .from('store_users')
              .select('store_id')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .limit(1)
              .maybeSingle()
            if (!mapErr && existingMap?.store_id) {
              storeId = existingMap.store_id
              await updateProfile({ store_id: storeId })
              toast.success('Using existing store')
            } else {
              toast.error('Permission denied creating store. Run add-store-rls-policies.sql')
              throw error
            }
            }
          } else {
            throw error
          }
        } else {
          storeId = inserted.id
          // create owner mapping if missing
          const { error: suErr } = await supabase.from('store_users').insert([{ store_id: storeId, user_id: user.id, role: 'owner' }])
          if (suErr && suErr.code !== '23505') {
            console.warn('Store user mapping failed:', suErr)
          }
          await updateProfile({ store_id: storeId })
        }
      } else {
        const { error } = await supabase.from('stores').update(payload).eq('id', storeId)
        if (error) throw error
      }
  toast.success('Store saved. Continue with your profile.')
  setStoreSetupOpen(false)
  setStoreStepDone(true)
  if (STORE_FLAG_KEY) localStorage.setItem(STORE_FLAG_KEY, '1')
      setProfileForm({
  full_name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.fullName || '',
        phone: profile.phone || '',
        job_title: profile.job_title || '',
        address: profile.address || ''
      })
      // Slight delay to allow modal switch animation then focus
      setTimeout(() => {
        setProfileSetupOpen(true)
        setTimeout(() => profileNameRef.current && profileNameRef.current.focus(), 50)
      }, 50)
    } catch (e) {
      console.error(e)
      toast.error('Failed to save store')
    } finally {
      setSavingStore(false)
    }
  }

  const validateProfile = () => {
    if (!profileForm.full_name.trim()) return 'Full Name is required'
    if (profileForm.phone && !phoneRegex.test(profileForm.phone)) return 'Invalid phone number'
    return null
  }

  const saveProfile = async () => {
    const err = validateProfile()
    if (err) { toast.error(err); return }
    setSavingProfile(true)
    try {
      await updateProfile({
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim() || null,
        job_title: profileForm.job_title.trim() || null,
        address: profileForm.address.trim() || null,
        setup_complete: true
      })
      toast.success('Profile setup complete')
      setProfileSetupOpen(false)
    } catch (e) {
      console.error(e)
      toast.error('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Block rendering of app content while setup required
  const gating = !loading && user && profile && !profile.setup_complete

  return (
    <>
      <div className={gating ? 'pointer-events-none select-none opacity-100' : ''} aria-hidden={gating ? 'true' : 'false'}>
        {children}
      </div>
      {/* Store Setup Modal */}
      <Modal isOpen={storeSetupOpen} onClose={() => {}} title="Store Setup (Step 1 of 2)" size="lg" showCloseButton={false}>
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">Complete your store details to continue.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Store Name *</label>
              <input ref={storeNameRef} className="input" placeholder="My Awesome Store" value={storeForm.name} onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Store Code *</label>
              <input className="input uppercase" placeholder="EXM123" value={storeForm.code} onChange={e=>setStoreForm(f=>({...f,code:e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g,'')}))} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Contact Email</label>
              <input className="input bg-gray-100 cursor-not-allowed" placeholder="owner@example.com" value={storeForm.email} readOnly disabled />
              <p className="text-xs text-gray-500 mt-1">Email auto-filled from signup.</p>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" className="input" placeholder="09XXXXXXXXX" value={storeForm.phone} onChange={e=>setStoreForm(f=>({...f,phone:e.target.value}))} />
            </div>
            <div>
              <label className="label">Currency *</label>
              <select className="input" value={storeForm.currency} onChange={e=>setStoreForm(f=>({...f,currency:e.target.value}))}>
                {currencyOptions.map(c=> <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Timezone *</label>
              <select className="input" value={storeForm.timezone} onChange={e=>setStoreForm(f=>({...f,timezone:e.target.value}))}>
                {timezoneOptions.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Store Address</label>
              <input className="input" placeholder="City, Province" value={storeForm.address} onChange={e=>setStoreForm(f=>({...f,address:e.target.value}))} />
            </div>
            <div>
              <label className="label">Tax Rate (%)</label>
              <input type="number" step="0.01" className="input" value={storeForm.tax_rate} onChange={e=>setStoreForm(f=>({...f,tax_rate:e.target.value}))} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Receipt Footer Text</label>
              <textarea className="input h-20" value={storeForm.receipt_footer} onChange={e=>setStoreForm(f=>({...f,receipt_footer:e.target.value}))} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button disabled={savingStore} onClick={saveStore} className="btn btn-primary btn-md">{savingStore? 'Saving...' : 'Save & Continue'}</button>
          </div>
        </div>
      </Modal>

      {/* Profile Setup Modal */}
  <Modal isOpen={profileSetupOpen} onClose={() => {}} title="User Profile Setup (Step 2 of 2)" size="lg" showCloseButton={false}>
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">Complete your profile to finish setup.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Full Name *</label>
              <input ref={profileNameRef} className="input" placeholder="John Doe" value={profileForm.full_name} onChange={e=>setProfileForm(f=>({...f,full_name:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium">Email Address</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                value={user?.email || ''}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Contact support to change your email.</p>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" className="input" placeholder="09XXXXXXXXX" value={profileForm.phone} onChange={e=>setProfileForm(f=>({...f,phone:e.target.value}))} />
            </div>
            <div>
              <label className="label">Job Title</label>
              <input className="input" placeholder="Manager" value={profileForm.job_title} onChange={e=>setProfileForm(f=>({...f,job_title:e.target.value}))} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input className="input" placeholder="Full Address" value={profileForm.address} onChange={e=>setProfileForm(f=>({...f,address:e.target.value}))} />
            </div>
          </div>
          <div className="flex justify-end pt-2 space-x-3">
            <button className="btn btn-secondary btn-md" disabled>Cancel</button>
            <button disabled={savingProfile} onClick={saveProfile} className="btn btn-primary btn-md">{savingProfile? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>

      {/* Optional overlay to block interactions behind modals */}
      {gating && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" />
      )}
    </>
  )
}

export default InitialSetupGate
