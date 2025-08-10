import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}) => {
  // Keep mounted for exit animation
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Defer to next paint to apply visible classes
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    } else {
      // Start exit animation
      setVisible(false)
      const timeout = setTimeout(() => setShouldRender(false), 220) // match durations below
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  if (!shouldRender) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0'}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden rounded-lg shadow-xl bg-white dark:bg-gray-800 transform transition-all duration-200 ease-out ${visible ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95'}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-300 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-theme(spacing.24))] text-gray-900 dark:text-gray-100">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
