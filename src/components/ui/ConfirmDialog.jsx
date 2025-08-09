import React from 'react'
import Modal from './Modal'
import { AlertTriangle, Info } from 'lucide-react'

// Reusable confirmation dialog built on top of Modal for consistent UX
const ConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // 'default' | 'danger'
  loading = false,
}) => {
  const isDanger = variant === 'danger'
  const Icon = isDanger ? AlertTriangle : Info

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <div className="p-6 space-y-5">
        <div className="flex items-start">
          <div className={`rounded-md p-2 ${isDanger ? 'bg-red-100' : 'bg-blue-100'}`}>
            <Icon className={`w-5 h-5 ${isDanger ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div className="ml-3">
            {description && (
              <p className="text-sm text-gray-700">{description}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
