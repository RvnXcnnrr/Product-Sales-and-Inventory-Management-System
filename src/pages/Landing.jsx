import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Menu, X, Shield, BarChart2, ShoppingCart, Package, Users, Moon, Sun } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Login from './auth/Login'
import Register from './auth/Register'
import ForgotPassword from './auth/ForgotPassword'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const NavLink = ({ href, children, onClick }) => (
  <a
    href={href}
    onClick={onClick}
    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium dark:text-gray-300 dark:hover:text-white"
  >
    {children}
  </a>
)

const Landing = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const closeLogin = () => setShowLogin(false)
  const closeRegister = () => setShowRegister(false)
  const closeForgot = () => setShowForgot(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <img src="/icons/logo-mark.svg" alt="POS" className="themed-logo w-8 h-8 mr-2" />
              <div className="text-xl font-bold text-primary-600">POS System</div>
              <nav className="hidden md:flex ml-6 items-center">
                <NavLink href="#about">About</NavLink>
                <NavLink href="#how">How to Use</NavLink>
                <NavLink href="#features">Features</NavLink>
                <button
                  className="ml-2 p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </nav>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              {user && (
                <Link to="/dashboard" className="btn btn-primary btn-sm">Open Dashboard</Link>
              )}
            </div>
            <button className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800/60" onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t">
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center flex-wrap gap-2">
                <NavLink href="#about" onClick={() => setMobileOpen(false)}>About</NavLink>
                <NavLink href="#how" onClick={() => setMobileOpen(false)}>How to Use</NavLink>
                <NavLink href="#features" onClick={() => setMobileOpen(false)}>Features</NavLink>
                <button
                  className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
              {/* Action button (authenticated only) */}
              {user && (
                <div className="pt-1">
                  <Link to="/dashboard" className="btn btn-primary btn-md w-full" onClick={() => setMobileOpen(false)}>Open Dashboard</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
  <section className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                Simple, fast, and secure POS for your business
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Manage sales, products, and inventory in one place. Real-time reports, role-based access, and an intuitive interface.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {user ? (
                  <Link to="/dashboard" className="btn btn-primary btn-lg">Open Dashboard</Link>
                ) : (
                  <>
                    <button className="btn btn-primary btn-lg" onClick={() => setShowRegister(true)}>Get Started</button>
                  </>
                )}
              </div>
              {!user && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Already have an account?{' '}
                  <button className="text-primary-500 hover:text-primary-400 font-medium" onClick={() => setShowLogin(true)}>Log in</button>
                </p>
              )}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600 text-sm">
                <div className="flex items-center"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Role-based access (Owner/Manager/Staff)</div>
                <div className="flex items-center"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Inventory + sales tracking</div>
                <div className="flex items-center"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Reports & analytics</div>
                <div className="flex items-center"><CheckCircle className="w-4 h-4 text-green-600 mr-2" /> Works great on mobile</div>
              </div>
            </div>
            <div className="relative">
        <div className="rounded-xl border bg-white shadow-sm p-4 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border dark:bg-blue-900/20 dark:border-blue-800"><ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" /><div className="mt-2 font-medium dark:text-gray-100">Point of Sale</div><div className="text-sm text-gray-600 dark:text-gray-300">Fast checkout with tax, discounts, and change.</div></div>
          <div className="p-4 rounded-lg bg-emerald-50 border dark:bg-emerald-900/20 dark:border-emerald-800"><Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /><div className="mt-2 font-medium dark:text-gray-100">Products</div><div className="text-sm text-gray-600 dark:text-gray-300">Manage SKUs, pricing, and stock levels.</div></div>
          <div className="p-4 rounded-lg bg-purple-50 border dark:bg-purple-900/20 dark:border-purple-800"><BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" /><div className="mt-2 font-medium dark:text-gray-100">Reports</div><div className="text-sm text-gray-600 dark:text-gray-300">Daily sales, top products, and trends.</div></div>
          <div className="p-4 rounded-lg bg-orange-50 border dark:bg-orange-900/20 dark:border-orange-800"><Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" /><div className="mt-2 font-medium dark:text-gray-100">Secure</div><div className="text-sm text-gray-600 dark:text-gray-300">Supabase auth, RLS, and activity logs.</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
    <section id="about" className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">About</h2>
      <p className="mt-4 text-gray-600 leading-relaxed dark:text-gray-300">
            This POS system helps small shops and teams sell faster and track inventory with confidence. It’s built with React and Supabase, has strict Row-Level Security, and supports multiple roles so your team can collaborate safely.
          </p>
        </div>
      </section>

      {/* How to Use */}
      <section id="how" className="bg-gray-50 py-16 sm:py-24 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">How to use this POS</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="text-sm font-semibold text-primary-600">Step 1</div>
              <div className="mt-1 font-medium dark:text-gray-100">Create your account & store</div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Register, then your store is created automatically. Set currency and tax in Settings.</p>
            </div>
            <div className="p-6 bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="text-sm font-semibold text-primary-600">Step 2</div>
              <div className="mt-1 font-medium dark:text-gray-100">Add products & categories</div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Create categories, add SKUs and stock. Low-stock badges help you restock in time.</p>
            </div>
            <div className="p-6 bg-white rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="text-sm font-semibold text-primary-600">Step 3</div>
              <div className="mt-1 font-medium dark:text-gray-100">Start selling</div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Use the Sales screen to add to cart and checkout. Inventory updates automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Key features</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{icon: <ShoppingCart className="w-6 h-6" />, title: 'POS & Cart', desc: 'Discounts, taxes, change, and receipt-ready totals.'},
              {icon: <Package className="w-6 h-6" />, title: 'Products & Inventory', desc: 'SKU, pricing, stock logs and low stock alerts.'},
              {icon: <BarChart2 className="w-6 h-6" />, title: 'Reports', desc: 'Top products, daily sales, and trends.'},
              {icon: <Users className="w-6 h-6" />, title: 'Users & Roles', desc: 'Owner/Manager/Staff with secure RLS-backed access.'},
              {icon: <Shield className="w-6 h-6" />, title: 'Security', desc: 'Supabase Auth with email verification sync.'}].map((f, idx) => (
              <div key={idx} className="p-6 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center dark:bg-gray-700 dark:text-primary-300">
                  {f.icon}
                </div>
                <div className="mt-3 font-semibold dark:text-gray-100">{f.title}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between dark:text-gray-400">
          <div>© {new Date().getFullYear()} POS System</div>
          <div className="mt-2 sm:mt-0 space-x-4">
            <a href="#about" className="hover:text-gray-700 dark:hover:text-gray-200">About</a>
            <a href="#how" className="hover:text-gray-700 dark:hover:text-gray-200">How to Use</a>
            <a href="#features" className="hover:text-gray-700 dark:hover:text-gray-200">Features</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Modal isOpen={showLogin} onClose={closeLogin} title="Sign in" size="md">
        <div className="p-4 sm:p-6">
          <Login onRequestRegister={() => { setShowLogin(false); setShowRegister(true) }} onRequestForgotPassword={() => { setShowLogin(false); setShowForgot(true) }} />
        </div>
      </Modal>

      {/* Register Modal */}
      <Modal isOpen={showRegister} onClose={closeRegister} title="Create account" size="md">
        <div className="p-4 sm:p-6">
          <Register onRequestLogin={() => { setShowRegister(false); setShowLogin(true) }} />
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal isOpen={showForgot} onClose={closeForgot} title="Reset password" size="md">
        <div className="p-4 sm:p-6">
          <ForgotPassword onRequestLogin={() => { setShowForgot(false); setShowLogin(true) }} />
        </div>
      </Modal>
    </div>
  )
}

export default Landing
