import React from 'react'
import { Menu, Bell, User, LogOut, ShoppingCart } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { Link } from 'react-router-dom'

const Header = ({ onMenuClick }) => {
  const { profile, signOut } = useAuth()
  const { totals } = useCart()

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="text-gray-500 hover:text-gray-600 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-sm text-gray-500">
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
          {/* Cart Indicator */}
          <Link
            to="/sales"
            className="relative p-2 text-gray-500 hover:text-gray-600 transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {totals.itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totals.itemCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-600 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-2 h-2"></span>
          </button>

          {/* User Menu */}
          <div className="relative flex items-center space-x-3">
            <Link
              to="/profile"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
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
              onClick={signOut}
              className="p-2 text-gray-500 hover:text-gray-600 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
