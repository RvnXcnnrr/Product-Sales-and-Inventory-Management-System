import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ForgotPassword = ({ onRequestLogin }) => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { resetPassword } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm()

  const onSubmit = async (data) => {
    const { error } = await resetPassword(data.email)
    
    if (error) {
      setError('root', { 
        type: 'manual', 
        message: error.message 
      })
    } else {
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto dark:bg-green-900/30">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            We&apos;ve sent a password reset link to your email address.
            Please check your inbox and follow the instructions.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Didn&apos;t receive the email?</strong> Check your spam folder or{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-blue-600 hover:text-blue-500 underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              try again
            </button>
          </p>
        </div>

        {onRequestLogin ? (
          <button onClick={onRequestLogin} className="inline-flex items-center text-sm text-primary-500 hover:text-primary-400">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
          </button>
        ) : (
          <Link to="/login" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="label">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="input pl-10"
              placeholder="Enter your email"
              autoComplete="email"
              autoFocus
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Error message */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-lg w-full"
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      {/* Back to login */}
      <div className="text-center">
        {onRequestLogin ? (
          <button onClick={onRequestLogin} className="inline-flex items-center text-sm text-primary-500 hover:text-primary-400">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
          </button>
        ) : (
          <Link to="/login" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
          </Link>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
