import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthError } from '../../components/ui/AuthErrorModal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, loading } = useAuth()
  const { showError } = useAuthError()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm()

  const onSubmit = async (data) => {
    try {
      // Prevent form submission from causing refreshes
      const result = await signIn(data.email, data.password)
      
      if (result.error) {
        console.error('Login error:', result.error.message);
        
        // Show modal error
        showError(
          'Login Failed', 
          result.error.message,
          'error'
        );
        
        // Also set form error
        setError('root', { 
          type: 'manual', 
          message: result.error.message 
        })
      } else {
        console.log('Login successful');
        // Let the auth state handle navigation
      }
    } catch (err) {
      console.error('Exception during login:', err);
      
      // Show modal error
      showError(
        'Login Error',
        'An unexpected error occurred. Please try again.',
        'error'
      );
      
      // Also set form error
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
  }

  if (loading) {
    return <LoadingSpinner text="Signing in..." />
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Access your POS system dashboard
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
              placeholder="Enter your password"
              autoComplete="current-password"
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

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Forgot password?
          </Link>
        </div>

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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Sign up link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Sign up here
          </Link>
        </p>
      </div>

    </div>
  )
}

export default Login
