import React, { useEffect, useMemo, useState } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Eye
} from 'lucide-react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase.js'
import { onAppEvent } from '../lib/eventBus'
import useSystemSettings from '../utils/systemSettings'
import { useAuth } from '../contexts/AuthContext.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [totals, setTotals] = useState({
    todaySales: 0,
    transactionsToday: 0,
    totalProducts: 0,
    lowStockCount: 0,
  })

  // Currency settings
  const { settings } = useSystemSettings()
  const { profile } = useAuth()
  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: settings?.currency || 'USD',
        maximumFractionDigits: 2,
      })
    } catch {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
    }
  }, [settings?.currency])

  // Helpers
  const startOfTodayISO = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Ensure base settings are hydrated if needed
        if (!settings?.currency && profile?.store_id) {
          await supabase.from('stores').select('currency').eq('id', profile.store_id).single()
        }
        // Recent transactions with item count (RLS ensures only user-accessible data)
        const { data: tx, error: txErr } = await supabase
          .from('transactions')
          .select('id, customer_name, total_amount, processed_at, status, transaction_items(count)')
          .order('processed_at', { ascending: false })
          .limit(5)

        if (txErr) throw txErr

        // Today transactions for metrics
        const { data: txToday, error: txTodayErr } = await supabase
          .from('transactions')
          .select('id, total_amount, processed_at')
          .gte('processed_at', startOfTodayISO)

        if (txTodayErr) throw txTodayErr

        // Products (count only)
        const { count: productsCount, error: prodCountErr } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })

        if (prodCountErr) throw prodCountErr

        // Low stock products (fetch and filter client-side for column comparison)
        const { data: products, error: lowErr } = await supabase
          .from('products')
          .select('id, name, sku, stock_quantity, min_stock_level, selling_price')
          .limit(25)

        if (lowErr) throw lowErr

        const low = (products || []).filter(p => (p.stock_quantity ?? 0) <= (p.min_stock_level ?? 0))

        if (!isMounted) return

        setRecentTransactions(
          (tx || []).map(t => ({
            id: t.id,
            customer: t.customer_name || '—',
            amount: Number(t.total_amount || 0),
            items: Array.isArray(t.transaction_items) && t.transaction_items.length > 0 && t.transaction_items[0]?.count != null
              ? t.transaction_items[0].count
              : undefined,
            time: new Date(t.processed_at).toLocaleString(),
            status: t.status || 'completed',
          }))
        )

        const todaySales = (txToday || []).reduce((sum, t) => sum + Number(t.total_amount || 0), 0)
        const transactionsToday = (txToday || []).length

        setLowStockProducts(low.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: p.stock_quantity ?? 0,
          minStock: p.min_stock_level ?? 0,
          price: Number(p.selling_price || 0),
        })))

        setTotals({
          todaySales,
          transactionsToday,
          totalProducts: productsCount || 0,
          lowStockCount: low.length,
        })
      } catch (e) {
        console.error('Dashboard load error:', e)
        if (isMounted) setError(e.message || 'Failed to load dashboard')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

  load()
  // Refresh when a sale completes
  const unsubscribe = onAppEvent('transaction:completed', () => load())
  return () => { isMounted = false; unsubscribe && unsubscribe() }
  }, [startOfTodayISO])

  const stats = useMemo(() => ([
    {
      title: "Today's Sales",
  value: currencyFormatter.format(totals.todaySales),
      change: '',
      changeType: 'neutral',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Products',
      value: `${totals.totalProducts}`,
      change: '',
      changeType: 'neutral',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Transactions (Today)',
      value: `${totals.transactionsToday}`,
      change: '',
      changeType: 'neutral',
      icon: ShoppingCart,
      color: 'bg-purple-500'
    },
    {
      title: 'Low Stock Items',
      value: `${totals.lowStockCount}`,
      change: '',
      changeType: 'neutral',
      icon: AlertTriangle,
      color: 'bg-orange-500'
    }
  ]), [totals])

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          Failed to load dashboard: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your store performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/sales"
            className="btn btn-primary btn-md"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Sale
          </Link>
          <Link
            to="/products"
            className="btn btn-secondary btn-md"
          >
            <Package className="w-4 h-4 mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-center mt-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <span className={`ml-2 text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <Link
                  to="/reports"
                  className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View All
                </Link>
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="table-header">
                    <tr>
                      <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="table-cell">
                          <div className="font-medium text-gray-900">{transaction.customer}</div>
                        </td>
                        <td className="table-cell">
                          <div className="font-medium text-gray-900">{currencyFormatter.format(transaction.amount)}</div>
                        </td>
                        <td className="table-cell">
                          <div className="text-gray-900">{transaction.items} items</div>
                        </td>
                        <td className="table-cell">
                          <div className="text-gray-500">{transaction.time}</div>
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-success">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="space-y-6">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
                <Link
                  to="/inventory"
                  className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Manage
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-red-600 font-medium">
                          {product.currentStock} in stock
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          (min: {product.minStock})
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <Link
                  to="/sales"
                  className="w-full btn btn-primary btn-md justify-start"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Process Sale
                </Link>
                <Link
                  to="/products"
                  className="w-full btn btn-secondary btn-md justify-start"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Add Product
                </Link>
                <Link
                  to="/inventory"
                  className="w-full btn btn-secondary btn-md justify-start"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Stock Management
                </Link>
                <Link
                  to="/reports"
                  className="w-full btn btn-secondary btn-md justify-start"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
