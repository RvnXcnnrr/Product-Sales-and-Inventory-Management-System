import React from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  className = ''
}) => {
  const types = {
    info: {
      icon: Info,
  bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  borderColor: 'border-blue-200 dark:border-blue-800',
  iconColor: 'text-blue-600 dark:text-blue-400',
  titleColor: 'text-blue-800 dark:text-blue-300',
  messageColor: 'text-blue-700 dark:text-blue-300'
    },
    success: {
      icon: CheckCircle,
  bgColor: 'bg-green-50 dark:bg-green-900/20',
  borderColor: 'border-green-200 dark:border-green-800',
  iconColor: 'text-green-600 dark:text-green-400',
  titleColor: 'text-green-800 dark:text-green-300',
  messageColor: 'text-green-700 dark:text-green-300'
    },
    warning: {
      icon: AlertTriangle,
  bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
  borderColor: 'border-yellow-200 dark:border-yellow-800',
  iconColor: 'text-yellow-600 dark:text-yellow-400',
  titleColor: 'text-yellow-800 dark:text-yellow-300',
  messageColor: 'text-yellow-700 dark:text-yellow-300'
    },
    error: {
      icon: AlertCircle,
  bgColor: 'bg-red-50 dark:bg-red-900/20',
  borderColor: 'border-red-200 dark:border-red-800',
  iconColor: 'text-red-600 dark:text-red-400',
  titleColor: 'text-red-800 dark:text-red-300',
  messageColor: 'text-red-700 dark:text-red-300'
    }
  }

  const config = types[type]
  const Icon = config.icon

  return (
    <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="flex">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor}`}>
              {title}
            </h3>
          )}
          {message && (
            <p className={`text-sm ${config.messageColor} ${title ? 'mt-1' : ''}`}>
              {message}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 ${config.iconColor} hover:opacity-75`}
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert
