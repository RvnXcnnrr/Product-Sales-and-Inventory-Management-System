import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoadingSpinner from './components/ui/LoadingSpinner'
import Layout from './components/layout/Layout'
import AuthLayout from './components/layout/AuthLayout'

// Import Login directly instead of lazy loading to debug
import Login from './pages/auth/Login'

// Lazy load other components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Products = React.lazy(() => import('./pages/Products'))
const Sales = React.lazy(() => import('./pages/Sales'))
const Inventory = React.lazy(() => import('./pages/Inventory'))
const Reports = React.lazy(() => import('./pages/Reports'))
const Settings = React.lazy(() => import('./pages/Settings'))
const Profile = React.lazy(() => import('./pages/Profile'))
const MigrationHelper = React.lazy(() => import('./pages/MigrationHelper'))
const Landing = React.lazy(() => import('./pages/Landing'))

// Auth components - import directly to avoid lazy loading issues
const Register = React.lazy(() => import('./pages/auth/Register'))
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'))

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />
  }
  
  if (!user) {
  console.log('ProtectedRoute: No user, redirecting to landing')
  return <Navigate to="/landing" replace />
  }
  
  return children
}

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />
  }
  
  if (user) {
    console.log('PublicRoute: User authenticated, redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <div className="App">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </PublicRoute>
          } />
          
          <Route path="/register" element={
            <PublicRoute>
              <AuthLayout>
                <Register />
              </AuthLayout>
            </PublicRoute>
          } />
          
          <Route path="/forgot-password" element={
            <PublicRoute>
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            </PublicRoute>
          } />

          {/* Public Landing Page */}
          <Route path="/landing" element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="migration" element={<MigrationHelper />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
