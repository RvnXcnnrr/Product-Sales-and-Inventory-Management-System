import React, { useState } from 'react'
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

const Settings = () => {
  const [activeTab, setActiveTab] = useState('store')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
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
            defaultValue="My Retail Store"
            placeholder="Enter store name"
          />
          {errors.storeName && <p className="text-sm text-red-600 mt-1">{errors.storeName.message}</p>}
        </div>

        <div>
          <label className="label">Store Code</label>
          <input
            {...register('storeCode')}
            className="input"
            defaultValue="STORE001"
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
            defaultValue="store@example.com"
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
            defaultValue="+1 (555) 123-4567"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="label">Currency</label>
          <select {...register('currency')} className="input" defaultValue="USD">
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
          </select>
        </div>

        <div>
          <label className="label">Timezone</label>
          <select {...register('timezone')} className="input" defaultValue="America/New_York">
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
          defaultValue="123 Main Street, City, State 12345"
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
            defaultValue="8.25"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="label">Receipt Footer Text</label>
          <input
            {...register('receiptFooter')}
            className="input"
            defaultValue="Thank you for shopping with us!"
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

  const UserSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <button className="btn btn-primary btn-md">
          <Users className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="table-cell">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-white">A</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Admin User</div>
                    <div className="text-sm text-gray-500">admin@store.com</div>
                  </div>
                </div>
              </td>
              <td className="table-cell">
                <span className="badge badge-success">Owner</span>
              </td>
              <td className="table-cell">
                <span className="badge badge-success">Active</span>
              </td>
              <td className="table-cell">
                <div className="text-sm text-gray-900">2 hours ago</div>
              </td>
              <td className="table-cell">
                <button className="text-primary-600 hover:text-primary-500 text-sm">
                  Edit
                </button>
              </td>
            </tr>
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
              <h5 className="font-medium text-gray-900 mb-2">Cashier</h5>
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
