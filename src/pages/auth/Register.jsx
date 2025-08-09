import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Store } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthError } from '../../components/ui/AuthErrorModal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import Alert from '../../components/ui/Alert'
import toast from 'react-hot-toast'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const { signUp, loading } = useAuth()
  const { showError } = useAuthError()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match'
      });
      
      showError(
        'Registration Error',
        'Passwords do not match. Please ensure both passwords are identical.',
        'error'
      );
      return;
    }

    console.log('🚀 Starting user registration with data:', {
      email: data.email,
      fullName: data.fullName,
      storeName: data.storeName,
      role: 'owner'
    });

    try {
      const result = await signUp(data.email, data.password, {
        full_name: data.fullName,
        store_name: data.storeName,
        role: 'owner'
      });
      
      console.log('📊 Registration result:', result);
      
      if (result?.error) {
        console.error('❌ Registration error:', result.error);
        
        // Show modal error
        showError(
          'Registration Failed',
          result.error.message || 'Registration failed. Please try again.',
          'error'
        );
        
        // Also set form error
        setError('root', { 
          type: 'manual', 
          message: result.error.message || 'Registration failed' 
        });
      } else {
        console.log('✅ Registration successful!')
        
        // Inform user to verify email before logging in
        const emailToShow = result?.data?.user?.email || data.email
        setRegisteredEmail(emailToShow)
        setShowVerifyModal(true)
        
        toast.success('Account created! Please check your email to verify your account.', {
          duration: 5000
        })
      }
    } catch (error) {
      console.error('💥 Registration exception:', error);
      
      // Show modal error
      showError(
        'Registration Error',
        error.message || 'An unexpected error occurred. Please try again.',
        'error'
      );
      
      // Also set form error
      setError('root', { 
        type: 'manual', 
        message: 'Registration failed: ' + error.message 
      });
    }
  }

  if (loading) {
    return <LoadingSpinner text="Creating account..." />
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Set up your POS system in minutes
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="label">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              {...register('fullName', {
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              className="input pl-10"
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        {/* Store Name */}
        <div>
          <label className="label">
            Store Name
          </label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              {...register('storeName', {
                required: 'Store name is required',
                minLength: {
                  value: 2,
                  message: 'Store name must be at least 2 characters'
                }
              })}
              className="input pl-10"
              placeholder="Enter your store name"
              autoComplete="organization"
            />
          </div>
          {errors.storeName && (
            <p className="mt-1 text-sm text-red-600">{errors.storeName.message}</p>
          )}
        </div>

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
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="label">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className="input pl-10 pr-10"
              placeholder="Create a password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              className="input pl-10 pr-10"
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms and conditions */}
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            {...register('terms', {
              required: 'You must accept the terms and conditions'
            })}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
            I agree to the{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.terms && (
          <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
        )}

        {/* Error message */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.root.message}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Sign in link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Sign in here
          </Link>
        </p>
      </div>

      {/* Post-signup verification modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => { setShowVerifyModal(false); navigate('/login') }}
        title="Verify your email"
        size="md"
      >
        <div className="p-6 space-y-5">
          <Alert
            type="info"
            message={`We've sent a verification link to ${registeredEmail || 'your email address'}. Please confirm your email to be able to log in.`}
          />
          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              onClick={() => { setShowVerifyModal(false); navigate('/login') }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Register
