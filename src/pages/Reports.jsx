import React, { useEffect, useMemo, useState } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  Download,
  Eye,
  ShoppingCart,
  Package
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import supabase from '../lib/supabase'
import { onAppEvent } from '../lib/eventBus'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../utils/format'

const Reports = () => {
  const [dateRange, setDateRange] = useState('7days')
  const [reportType, setReportType] = useState('sales')
  const { profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [transactionItems, setTransactionItems] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  // Load data for selected range
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        if (!profile?.store_id) {
          if (isMounted) {
            setTransactions([]); setTransactionItems([]); setProducts([]); setCategories([])
          }
          return
        }

        const now = new Date()
        const from = new Date()
        if (dateRange === '7days') from.setDate(now.getDate() - 6)
        else if (dateRange === '30days') from.setDate(now.getDate() - 29)
        else if (dateRange === '90days') from.setDate(now.getDate() - 89)
        else if (dateRange === 'year') from.setMonth(0, 1)

        const fromIso = from.toISOString()

        const txRes = await supabase
          .from('transactions')
          .select('id, total_amount, processed_at')
          .eq('store_id', profile.store_id)
          .gte('processed_at', fromIso)
          .order('processed_at', { ascending: true })

        if (txRes.error) throw txRes.error
        const txIds = (txRes.data || []).map(t => t.id)

        const [itemsRes, prodRes, catRes] = await Promise.all([
          txIds.length > 0
            ? supabase.from('transaction_items')
                .select('id, product_id, quantity, total_price')
                .in('transaction_id', txIds)
            : Promise.resolve({ data: [], error: null }),
          supabase.from('products').select('id, name, category_id').eq('store_id', profile.store_id),
          supabase.from('categories').select('id, name').eq('store_id', profile.store_id)
        ])

        if (txRes.error) throw txRes.error
        if (itemsRes.error) throw itemsRes.error
        if (prodRes.error) throw prodRes.error
        if (catRes.error) throw catRes.error

        if (!isMounted) return
        setTransactions(txRes.data || [])
        setTransactionItems(itemsRes.data || [])
        setProducts(prodRes.data || [])
        setCategories(catRes.data || [])
      } catch (e) {
        console.error(e)
        setError('Failed to load reports')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    if (!authLoading) load(); else setLoading(true)
    const unsubscribe = onAppEvent('transaction:completed', () => load())
    return () => { isMounted = false; unsubscribe && unsubscribe() }
  }, [authLoading, profile?.store_id, dateRange])

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories])
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products])

  // Compute metrics
  const metrics = useMemo(() => {
    const totalSales = transactions.reduce((s, t) => s + Number(t.total_amount || 0), 0)
    const totalTransactions = transactions.length
    const averageTransaction = totalTransactions ? totalSales / totalTransactions : 0
    const totalProducts = products.length
    // Low stock requires stock info; use 0 until extended here
    return { totalSales, totalTransactions, averageTransaction, totalProducts, lowStockItems: 0, topSellingCategory: '' }
  }, [transactions, products])

  // Sales trend by day
  const salesData = useMemo(() => {
    const byDay = new Map()
    for (const t of transactions) {
      const d = new Date(t.processed_at)
      const key = d.toLocaleDateString()
      const val = byDay.get(key) || { name: key, sales: 0, transactions: 0 }
      val.sales += Number(t.total_amount || 0)
      val.transactions += 1
      byDay.set(key, val)
    }
    return Array.from(byDay.values())
  }, [transactions])

  // Category distribution based on transaction items
  const categoryAgg = useMemo(() => {
    const counts = new Map()
    for (const item of transactionItems) {
      const prod = productMap.get(item.product_id)
      if (!prod) continue
      const catName = categoryMap.get(prod.category_id) || 'Uncategorized'
      counts.set(catName, (counts.get(catName) || 0) + Number(item.total_price || 0))
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']
    return Array.from(counts.entries()).map(([name, amount], idx) => ({ name, value: Math.round((amount / total) * 100), color: palette[idx % palette.length] }))
  }, [transactionItems, productMap, categoryMap])

  // Top products by revenue
  const topProducts = useMemo(() => {
    // Track both revenue and units sold per product
    const agg = new Map()
    for (const item of transactionItems) {
      const prev = agg.get(item.product_id) || { revenue: 0, units: 0 }
      prev.revenue += Number(item.total_price || 0)
      prev.units += Number(item.quantity || 0)
      agg.set(item.product_id, prev)
    }
    const ranked = Array.from(agg.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([pid, { revenue, units }]) => ({ id: pid, name: productMap.get(pid)?.name || 'Product', sales: units, revenue }))
    return ranked
  }, [transactionItems, productMap])

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">Loading reports…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-red-600">{error}</div>
      </div>
    )
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '7days': return 'Last 7 Days'
      case '30days': return 'Last 30 Days'
      case '90days': return 'Last 90 Days'
      case 'year': return 'This Year'
      default: return 'Last 7 Days'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Insights into your business performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn btn-secondary btn-md">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="label">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="products">Product Performance</option>
              <option value="financial">Financial Summary</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

  {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
      <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalSales || 0)}</p>
      <p className="text-sm text-gray-500">{getDateRangeLabel()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalTransactions}</p>
              <p className="text-sm text-blue-600">+8.3% from last period</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.averageTransaction || 0)}</p>
              <p className="text-sm text-gray-500">{getDateRangeLabel()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</p>
              <p className="text-sm text-gray-500">{metrics.lowStockItems} low stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <p className="text-sm text-gray-500">{getDateRangeLabel()}</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
      <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
        name === 'sales' ? formatCurrency(value) : value,
                    name === 'sales' ? 'Sales' : 'Transactions'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sales by Category</h3>
            <p className="text-sm text-gray-500">Distribution of sales across categories</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryAgg}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {categoryAgg.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
              <button className="text-sm text-primary-600 hover:text-primary-500 flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                View All
              </button>
            </div>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
        {topProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                        </div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </div>
                    </td>
                    <td className="table-cell">
          <div className="text-sm font-medium">{product.sales ?? 0}</div>
                    </td>
                    <td className="table-cell">
          <div className="text-sm font-medium">{formatCurrency(product.revenue || 0)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {([...transactions]
                .sort((a, b) => new Date(b.processed_at) - new Date(a.processed_at))
                .slice(0, 4)).map((t) => (
                <div key={t.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Sale completed</p>
                    <p className="text-xs text-gray-500">{formatCurrency(Number(t.total_amount || 0))} • {new Date(t.processed_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Sales Chart */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Daily Sales Overview</h3>
          <p className="text-sm text-gray-500">Sales and transaction volume comparison</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
    <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
      name === 'sales' ? formatCurrency(value) : value,
                  name === 'sales' ? 'Sales' : 'Transactions'
                ]}
              />
              <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" />
              <Bar yAxisId="right" dataKey="transactions" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Reports
