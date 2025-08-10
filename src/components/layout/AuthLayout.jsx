import React from 'react'

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">
            POS System
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Product Sales & Inventory Management
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-8 dark:bg-gray-800">
          {children}
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          © 2024 POS System. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
