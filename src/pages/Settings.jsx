import React, { useState, useEffect, useMemo } from 'react'
import { 
  Store, 
  Users, 
  CreditCard, 
  Bell, 
  Shield, 
  Globe,
  Printer,
  Database,
  Wifi,
  Save,
  RefreshCw
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import useSystemSettings from '../utils/systemSettings'
import { useAuth } from '../contexts/AuthContext.jsx'
import supabase from '../lib/supabase.js'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('store')
  const [loading, setLoading] = useState(false)
  const { settings, updateSettings, saveAll } = useSystemSettings()
  const { profile } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  // Initialize form with system settings
  useEffect(() => {
    reset({
      storeName: settings.storeName || '',
      storeCode: settings.storeCode || '',
      email: settings.email || '',
      phone: settings.phone || '',
      address: settings.address || '',
      currency: settings.currency || 'PHP',
      // Preserve 0% tax instead of falling back
      taxRate: settings.taxRate != null ? (settings.taxRate * 100) : 10,
      timezone: settings.timezone || 'Asia/Manila',
      receiptFooter: settings.receiptFooter || 'Thank you for shopping with us!'
      // Add other settings as needed
    });
  }, [settings, reset]);

  const tabs = [
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database }
  ]

  const handleSaveSettings = async (data) => {
    setLoading(true)
    try {
      // Update local state first for instant UI
      updateSettings({
        storeName: data.storeName,
        storeCode: data.storeCode,
        email: data.email,
        phone: data.phone,
        address: data.address,
        currency: data.currency,
        taxRate: parseFloat(data.taxRate) / 100,
        timezone: data.timezone,
        receiptFooter: data.receiptFooter,
      })

      // Persist to Supabase per-store
      const storeId = profile?.store_id
      if (storeId) {
        // Save base store info as well
        const { error: storeErr } = await supabase
          .from('stores')
          .update({
            name: data.storeName,
            code: data.storeCode,
            email: data.email,
            phone: data.phone,
            address: data.address,
          })
          .eq('id', storeId)
        if (storeErr) throw storeErr

        const { error } = await saveAll()
        if (error) throw error
      }

      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const StoreSettings = () => (
    <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Store Name *</label>
          <input
            {...register('storeName', { required: 'Store name is required' })}
            className="input"
            defaultValue={settings.storeName || ''}
            placeholder="Enter store name"
          />
          {errors.storeName && <p className="text-sm text-red-600 mt-1">{errors.storeName.message}</p>}
        </div>

        <div>
          <label className="label">Store Code</label>
          <input
            {...register('storeCode')}
            className="input"
            defaultValue={settings.storeCode || ''}
            placeholder="Enter store code"
          />
        </div>

        <div>
          <label className="label">Contact Email *</label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="input"
            defaultValue={settings.email || ''}
            placeholder="Enter email address"
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Phone Number</label>
          <input
            type="tel"
            {...register('phone')}
            className="input"
            defaultValue={settings.phone || ''}
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="label">Currency</label>
          <select {...register('currency')} className="input" defaultValue={settings.currency || "PHP"}>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="PHP">PHP - Philippine Peso (₱)</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
          </select>
        </div>

        <div>
          <label className="label">Timezone</label>
          <select {...register('timezone')} className="input" defaultValue={settings.timezone || "Asia/Manila"}>
            <option value="Asia/Manila">Philippines (PHT/GMT+8)</option>
            <option value="America/New_York">Eastern Time (EST/EDT)</option>
            <option value="America/Chicago">Central Time (CST/CDT)</option>
            <option value="America/Denver">Mountain Time (MST/MDT)</option>
            <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Store Address</label>
        <textarea
          {...register('address')}
          className="input h-24 resize-none"
          defaultValue={settings.address || ''}
          placeholder="Enter complete store address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Tax Rate (%)</label>
          <input
            type="number"
            step="0.01"
            {...register('taxRate')}
            className="input"
            min={0}
            // Preserve 0% tax instead of falling back
            defaultValue={settings.taxRate != null ? (settings.taxRate * 100) : 10}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="label">Receipt Footer Text</label>
          <input
            {...register('receiptFooter')}
            className="input"
            defaultValue={settings.receiptFooter || "Thank you for shopping with us!"}
            placeholder="Enter receipt footer text"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-md"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  )

  const UserSettings = () => {
  const [members, setMembers] = useState([])
    const [emailToAdd, setEmailToAdd] = useState('')
    const [roleToAdd, setRoleToAdd] = useState('staff')
    const [busy, setBusy] = useState(false)

    const storeId = profile?.store_id
    const isOwnerOrManager = useMemo(() => {
      const me = members.find(m => m.user_id === profile?.id)
      const role = me?.role || profile?.role
      return role === 'owner' || role === 'manager'
    }, [members, profile?.id, profile?.role])

    const isValidEmail = (val) => /.+@.+\..+/.test((val || '').trim())

    const loadMembers = async () => {
      if (!storeId) return
      setBusy(true)
      try {
        // Try RPC first
        const { data, error } = await supabase.rpc('get_store_users', { p_store_id: storeId })
        if (error) {
          // If RPC missing (404) or not deployed, fallback to direct select with RLS policy
          const { data: su, error: suErr } = await supabase
            .from('store_users')
            .select('user_id, role, is_active, created_at, updated_at')
            .eq('store_id', storeId)
          if (suErr) throw suErr

          const userIds = (su || []).map(r => r.user_id)
          let profilesMap = {}
          if (userIds.length > 0) {
            const { data: profs, error: pErr } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', userIds)
            if (pErr) throw pErr
            profilesMap = Object.fromEntries((profs || []).map(p => [p.id, p]))
          }

          const mapped = (su || []).map(r => ({
            user_id: r.user_id,
            full_name: profilesMap[r.user_id]?.full_name,
            email: profilesMap[r.user_id]?.email,
            role: r.role,
            is_active: r.is_active,
            created_at: r.created_at,
            updated_at: r.updated_at,
          }))
          setMembers(mapped)
        } else {
          setMembers(data || [])
        }
      } catch (e) {
        toast.error('Failed to load members')
        console.error(e)
      } finally {
        setBusy(false)
      }
    }

    useEffect(() => { loadMembers() }, [storeId])

    const onAddUser = async () => {
      if (!emailToAdd) return
      setBusy(true)
      try {
        const { error } = await supabase.rpc('add_user_to_store', {
          p_store_id: storeId,
          p_email: emailToAdd,
          p_role: roleToAdd
        })
        if (error) {
          // Fallback: find user by email then insert into store_users (requires RLS policy allowing owner/manager)
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', emailToAdd)
            .limit(1)
            .single()
          if (profErr || !prof?.id) throw error
          const { error: insErr } = await supabase
            .from('store_users')
            .insert({ store_id: storeId, user_id: prof.id, role: roleToAdd, is_active: true })
          if (insErr) throw error
        }
        setEmailToAdd('')
        setRoleToAdd('staff')
        toast.success('User added to store')
        loadMembers()
      } catch (e) {
        toast.error(e.message || 'Failed to add user')
      } finally {
        setBusy(false)
      }
    }

    const onUpdate = async (user_id, role, is_active) => {
      setBusy(true)
      try {
        const { error } = await supabase.rpc('update_store_user', {
          p_store_id: storeId,
          p_user_id: user_id,
          p_role: role,
          p_is_active: is_active
        })
        if (error) {
          // Fallback: direct update permitted by RLS for owner/manager
          const { error: upErr } = await supabase
            .from('store_users')
            .update({ role, is_active })
            .eq('store_id', storeId)
            .eq('user_id', user_id)
          if (upErr) throw error
        }
        toast.success('Member updated')
        loadMembers()
      } catch (e) {
        toast.error(e.message || 'Failed to update')
      } finally {
        setBusy(false)
      }
    }

    const onRemove = async (user_id) => {
      setBusy(true)
      try {
        const { error } = await supabase.rpc('remove_store_user', {
          p_store_id: storeId,
          p_user_id: user_id
        })
        if (error) {
          // Fallback: block removal if possibly last owner (simple client-side check), then try direct delete
          const owners = members.filter(m => m.role === 'owner' && m.is_active)
          if (owners.length <= 1 && owners[0]?.user_id === user_id) {
            toast.error('Cannot remove the last active owner')
            setBusy(false)
            return
          }
          const { error: delErr } = await supabase
            .from('store_users')
            .delete()
            .eq('store_id', storeId)
            .eq('user_id', user_id)
          if (delErr) throw error
        }
        toast.success('Member removed')
        loadMembers()
      } catch (e) {
        toast.error(e.message || 'Failed to remove')
      } finally {
        setBusy(false)
      }
    }

    const currentUserMember = useMemo(() => members.find(m => m.user_id === profile?.id), [members, profile?.id])
    const displayMembers = useMemo(() => (
      currentUserMember?.role === 'owner'
        ? members.filter(m => m.user_id !== profile?.id)
        : members
    ), [members, currentUserMember, profile?.id])

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        </div>

        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="label">User Email</label>
              <input
                type="email"
                value={emailToAdd}
                onChange={(e) => setEmailToAdd(e.target.value)}
                className="input"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={roleToAdd} onChange={(e) => setRoleToAdd(e.target.value)}>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div>
              <button
                className="btn btn-primary btn-md"
                onClick={onAddUser}
                disabled={busy || !storeId || !isOwnerOrManager || !isValidEmail(emailToAdd)}
                title={!isOwnerOrManager ? 'Only owners or managers can add users' : (!isValidEmail(emailToAdd) ? 'Enter a valid email' : '')}
              >
                <Users className="w-4 h-4 mr-2" />
                Add User
              </button>
              {!isOwnerOrManager && (
                <p className="text-xs text-gray-500 mt-2">Only owners or managers can add users.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="table-cell text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayMembers.map((m) => (
                <tr key={m.user_id}>
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{m.full_name || '—'}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-600">{m.email}</div>
                  </td>
                  <td className="table-cell">
                    <select
                      className="input"
                      value={m.role}
                      onChange={(e) => onUpdate(m.user_id, e.target.value, m.is_active)}
                    >
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                  <td className="table-cell">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        checked={!!m.is_active}
                        onChange={(e) => onUpdate(m.user_id, m.role, e.target.checked)}
                      />
                      <span className="ml-2 text-sm">{m.is_active ? 'Active' : 'Inactive'}</span>
                    </label>
                  </td>
                  <td className="table-cell text-right">
                    <button className="text-red-600 hover:text-red-500 text-sm" onClick={() => onRemove(m.user_id)} disabled={busy}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {displayMembers.length === 0 && (
                <tr>
                  <td className="table-cell text-center text-gray-500 py-6" colSpan={5}>
                    {busy ? 'Loading members…' : 'No users found for this store.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Role Permissions</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4">
                <h5 className="font-medium text-gray-900 mb-2">Owner</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full system access</li>
                  <li>• Manage users & settings</li>
                  <li>• View all reports</li>
                  <li>• Process transactions</li>
                </ul>
              </div>
              <div className="card p-4">
                <h5 className="font-medium text-gray-900 mb-2">Manager</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Manage products & inventory</li>
                  <li>• View reports</li>
                  <li>• Process transactions</li>
                  <li>• Limited user management</li>
                </ul>
              </div>
              <div className="card p-4">
                <h5 className="font-medium text-gray-900 mb-2">Staff</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Process transactions</li>
                  <li>• View product catalog</li>
                  <li>• Basic reporting</li>
                  <li>• No system settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const PaymentSettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Cash Payments</p>
                <p className="text-sm text-gray-500">Accept cash transactions</p>
              </div>
            </div>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Credit/Debit Cards</p>
                <p className="text-sm text-gray-500">Accept card payments</p>
              </div>
            </div>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Digital Wallets</p>
                <p className="text-sm text-gray-500">Apple Pay, Google Pay, etc.</p>
              </div>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Print Receipt Automatically</p>
              <p className="text-sm text-gray-500">Auto-print receipt after each transaction</p>
            </div>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Receipt Option</p>
              <p className="text-sm text-gray-500">Offer to email receipts to customers</p>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Receipt Logo</p>
              <p className="text-sm text-gray-500">Include store logo on receipts</p>
            </div>
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const NotificationSettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Low Stock Alerts</p>
              <p className="text-sm text-gray-500">Get notified when products are running low</p>
            </div>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Daily Sales Summary</p>
              <p className="text-sm text-gray-500">Receive daily sales reports via email</p>
            </div>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">System Updates</p>
              <p className="text-sm text-gray-500">Get notified about system updates and maintenance</p>
            </div>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const SecuritySettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="btn btn-secondary btn-sm">Enable</button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Session Timeout</p>
              <p className="text-sm text-gray-500">Automatically log out inactive users</p>
            </div>
            <select className="input w-32">
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Password Policy</p>
              <p className="text-sm text-gray-500">Enforce strong password requirements</p>
            </div>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Backup</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Automatic Backup</p>
              <p className="text-sm text-gray-500">Daily automatic backup of your data</p>
            </div>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Last Backup</p>
              <p className="text-sm text-gray-500">January 25, 2024 at 2:30 AM</p>
            </div>
            <button className="btn btn-secondary btn-sm">
              <Database className="w-4 h-4 mr-1" />
              Backup Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const SystemSettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hardware Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Printer className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Receipt Printer</p>
                <p className="text-sm text-gray-500">EPSON TM-T20III - Connected</p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm">Configure</button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Card Reader</p>
                <p className="text-sm text-gray-500">Square Reader - Not Connected</p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm">Setup</button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wifi className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Internet Connection</p>
                <p className="text-sm text-gray-500">Connected - Good Signal</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Version:</span>
            <span className="font-medium">v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Database:</span>
            <span className="font-medium">PostgreSQL 14.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Storage Used:</span>
            <span className="font-medium">2.3 GB / 10 GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Update:</span>
            <span className="font-medium">January 20, 2024</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'store': return <StoreSettings />
      case 'users': return <UserSettings />
      case 'payment': return <PaymentSettings />
      case 'notifications': return <NotificationSettings />
      case 'security': return <SecuritySettings />
      case 'system': return <SystemSettings />
      default: return <StoreSettings />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your store settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{renderTabContent()}</div>
    </div>
  )
}

export default Settings
