import React, { useState } from 'react'
import { Menu, Bell, LogOut, ShoppingCart, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useNotifications } from '../../contexts/NotificationsContext'
import { useTheme } from '../../contexts/ThemeContext'

const Header = ({ onMenuClick }) => {
  const { profile, signOut } = useAuth()
  const { totals } = useCart()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [openNotif, setOpenNotif] = useState(false)
  const { items: notifications, unread, markAllRead } = useNotifications()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await signOut()
  }

  return (
  <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          <img src="/icons/logo-mark.svg" alt="POS" className="themed-logo hidden md:block w-8 h-8 mr-3" />
          <button
            onClick={onMenuClick}
            className="text-gray-500 hover:text-gray-600 lg:hidden dark:text-gray-300 dark:hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-600 transition-colors dark:text-gray-300 dark:hover:text-white"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {/* Cart Indicator */}
          <Link
            to="/sales"
            className="relative p-2 text-gray-500 hover:text-gray-600 transition-colors dark:text-gray-300 dark:hover:text-white"
          >
            <ShoppingCart className="w-6 h-6" />
            {totals.itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totals.itemCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative p-2 text-gray-500 hover:text-gray-600 transition-colors dark:text-gray-300 dark:hover:text-white"
              onClick={() => setOpenNotif(o => !o)}
              title="Notifications"
            >
              <Bell className="w-6 h-6" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
            {openNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="text-sm font-medium dark:text-gray-100">Notifications</span>
                  <button className="text-xs text-primary-600 hover:underline" onClick={markAllRead} disabled={!unread}>Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b last:border-b-0 ${n.is_read ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</div>
                        {n.message && <div className="text-sm text-gray-600 mt-0.5 dark:text-gray-300">{n.message}</div>}
                        <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative flex items-center space-x-3">
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors dark:text-gray-300 dark:hover:text-white"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium">
                {profile?.full_name || 'User'}
              </span>
            </Link>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-gray-500 hover:text-gray-600 transition-colors dark:text-gray-300 dark:hover:text-white"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log out?"
        description="You'll be signed out of your session."
        confirmText="Log out"
      />
  </header>
  )
}

export default Header
