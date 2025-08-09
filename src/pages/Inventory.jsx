import React, { useEffect, useState } from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Search,
  Download,
  Plus,
  Minus,
  Edit,
  History
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/format'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [showStockUpdate, setShowStockUpdate] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [pendingAdjustment, setPendingAdjustment] = useState(null)
  const [showConfirmAdjustment, setShowConfirmAdjustment] = useState(false)
  const { profile, user, loading: authLoading } = useAuth()

  // DB-backed state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [categoryMap, setCategoryMap] = useState(new Map())
  const [categoriesList, setCategoriesList] = useState(['all'])
  const [inventoryLogs, setInventoryLogs] = useState([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  // Derived inventory view from products
  const inventory = products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: categoryMap.get(p.category_id) || 'Uncategorized',
    current_stock: p.stock_quantity,
    min_stock_level: p.min_stock_level || 0,
    max_stock_level: p.max_stock_level || 0,
    cost_price: Number(p.cost_price) || 0,
    selling_price: Number(p.selling_price) || 0,
    total_value: (Number(p.stock_quantity) || 0) * (Number(p.cost_price) || 0),
    last_updated: p.updated_at,
    supplier: '-',
    location: '-'
  }))

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!profile?.store_id) {
          if (isMounted) {
            setProducts([])
            setCategoryMap(new Map())
            setCategoriesList(['all'])
            setInventoryLogs([])
          }
          return
        }

        const [{ data: prods, error: prodErr }, { data: cats, error: catErr }] = await Promise.all([
          supabase.from('products')
            .select('id, name, sku, stock_quantity, min_stock_level, max_stock_level, cost_price, selling_price, category_id, updated_at')
            .eq('store_id', profile.store_id)
            .order('updated_at', { ascending: false }),
          supabase.from('categories')
            .select('id, name')
            .eq('store_id', profile.store_id)
            .order('name')
        ])

        if (prodErr) throw prodErr
        if (catErr) throw catErr

        const map = new Map((cats || []).map(c => [c.id, c.name]))
        if (!isMounted) return
        setProducts(prods || [])
        setCategoryMap(map)
        setCategoriesList(['all', ...Array.from(new Set((prods || []).map(p => map.get(p.category_id)).filter(Boolean)))])

        const { data: logs, error: logErr } = await supabase
          .from('inventory_logs')
          .select('id, type, quantity_change, reason, created_at, product:products(name, sku)')
          .eq('store_id', profile.store_id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (logErr) throw logErr
        setInventoryLogs(logs || [])
      } catch (e) {
        console.error(e)
        setError('Failed to load inventory')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (!authLoading) {
      loadData()
    } else {
      setLoading(true)
    }

    return () => { isMounted = false }
  }, [authLoading, profile?.store_id])

  const categories = categoriesList

  const getStockStatus = (item) => {
    if (item.current_stock === 0) {
      return { status: 'out', label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' }
    } else if (item.current_stock <= item.min_stock_level) {
      return { status: 'low', label: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-100' }
    } else if (item.current_stock >= item.max_stock_level * 0.8) {
      return { status: 'high', label: 'High Stock', color: 'text-blue-600', bg: 'bg-blue-100' }
    }
    return { status: 'good', label: 'Normal', color: 'text-green-600', bg: 'bg-green-100' }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = item.current_stock <= item.min_stock_level
    } else if (stockFilter === 'out') {
      matchesStock = item.current_stock === 0
    } else if (stockFilter === 'normal') {
      matchesStock = item.current_stock > item.min_stock_level
    }
    
    return matchesSearch && matchesCategory && matchesStock
  })

  const totalValue = inventory.reduce((sum, item) => sum + item.total_value, 0)
  const lowStockCount = inventory.filter(item => item.current_stock <= item.min_stock_level).length
  const outOfStockCount = inventory.filter(item => item.current_stock === 0).length

  const applyStockUpdate = async (adjustment) => {
    if (!selectedProduct) return
    try {
      const productId = selectedProduct.id
      const prevQty = selectedProduct.current_stock
      const newQty = Math.max(0, prevQty + adjustment)

      // Update product quantity
      const { error: updErr } = await supabase
        .from('products')
        .update({ stock_quantity: newQty })
        .eq('id', productId)
        .select()

      if (updErr) throw updErr

      // Insert inventory log
      const { error: logErr } = await supabase
        .from('inventory_logs')
        .insert([{
          product_id: productId,
          store_id: profile?.store_id || null,
          type: adjustment >= 0 ? 'adjustment' : 'adjustment',
          quantity_change: adjustment,
          previous_quantity: prevQty,
          new_quantity: newQty,
          reason: 'Manual adjustment',
          reference_type: 'manual',
          created_by: user?.id || null,
          notes: ''
        }])

      if (logErr) throw logErr

      // Refresh products and logs
      setProducts(products.map(p => p.id === productId ? { ...p, stock_quantity: newQty, updated_at: new Date().toISOString() } : p))
      setInventoryLogs([{
        id: Date.now(),
        type: 'adjustment',
        quantity_change: adjustment,
        reason: 'Manual adjustment',
        created_at: new Date().toISOString(),
        product: { name: selectedProduct.name, sku: selectedProduct.sku }
      }, ...inventoryLogs])

      setShowStockUpdate(false)
      setSelectedProduct(null)
      reset()
      const actionType = adjustment > 0 ? 'increased' : 'decreased'
      toast.success(`Stock ${actionType} successfully!`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to update stock')
    }
  }

  const handleStockUpdate = (data) => {
    const adjustment = parseInt(data.adjustment)
    // If reducing stock, ask for confirmation
    if (adjustment < 0) {
      setPendingAdjustment(adjustment)
      setShowConfirmAdjustment(true)
      return
    }
    applyStockUpdate(adjustment)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage your stock levels
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowHistory(true)}
            className="btn btn-secondary btn-md"
          >
            <History className="w-4 h-4 mr-2" />
            Stock History
          </button>
          <button className="btn btn-secondary btn-md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input w-full lg:w-auto"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="input w-full lg:w-auto"
          >
            <option value="all">All Stock Levels</option>
            <option value="normal">Normal Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min/Max
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item)
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 font-mono">{item.sku}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">{item.category}</span>
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-lg">{item.current_stock}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <div>Min: {item.min_stock_level}</div>
                        <div>Max: {item.max_stock_level}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(item.total_value)}</div>
                        <div className="text-gray-500">{formatCurrency(item.cost_price)} each</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm font-mono">{item.location}</div>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => {
                          setSelectedProduct(item)
                          setShowStockUpdate(true)
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

  {filteredInventory.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
  )}
      </div>

      {/* Stock Update Modal */}
      <Modal
        isOpen={showStockUpdate}
        onClose={() => {
          setShowStockUpdate(false)
          setSelectedProduct(null)
          reset()
        }}
        title="Adjust Stock Level"
        size="md"
      >
  {selectedProduct && (
          <form onSubmit={handleSubmit(handleStockUpdate)} className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
              <p className="text-sm text-gray-500">Current Stock: {selectedProduct.current_stock}</p>
            </div>

            <div>
              <label className="label">Stock Adjustment</label>
              <input
                type="number"
                {...register('adjustment', { 
                  required: 'Adjustment amount is required',
                  validate: value => {
                    const adj = parseInt(value)
                    if (adj === 0) return 'Adjustment cannot be zero'
                    if (selectedProduct.current_stock + adj < 0) {
                      return 'Cannot reduce stock below zero'
                    }
                    return true
                  }
                })}
                className="input"
                placeholder="Enter positive number to add, negative to remove"
              />
              {errors.adjustment && (
                <p className="text-sm text-red-600 mt-1">{errors.adjustment.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Use positive numbers to increase stock, negative to decrease
              </p>
            </div>

            <div>
              <label className="label">Reason</label>
              <select
                {...register('reason', { required: 'Reason is required' })}
                className="input"
              >
                <option value="">Select reason</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="Stock Return">Stock Return</option>
                <option value="Damage/Loss">Damage/Loss</option>
                <option value="Theft">Theft</option>
                <option value="Manual Correction">Manual Correction</option>
                <option value="Transfer">Transfer</option>
                <option value="Other">Other</option>
              </select>
              {errors.reason && (
                <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>
              )}
            </div>

            <div>
              <label className="label">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                className="input h-20 resize-none"
                placeholder="Additional notes about this adjustment"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowStockUpdate(false)
                  setSelectedProduct(null)
                  reset()
                }}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-md"
              >
                Update Stock
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm negative adjustment */}
      <ConfirmDialog
        isOpen={showConfirmAdjustment}
        onCancel={() => setShowConfirmAdjustment(false)}
        onConfirm={() => { if (typeof pendingAdjustment === 'number') applyStockUpdate(pendingAdjustment); setShowConfirmAdjustment(false) }}
        title="Reduce stock?"
        description="You're about to reduce the stock quantity. This will update current stock and cannot be undone."
        confirmText="Reduce"
        variant="danger"
      />

      {/* Stock History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Stock Movement History"
        size="lg"
      >
        <div className="p-6">
          <div className="space-y-4">
            {inventoryLogs.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${entry.quantity_change >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {entry.quantity_change >= 0 ? (
                      <Plus className="w-4 h-4 text-green-600" />
                    ) : (
                      <Minus className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{entry.product?.name || 'Product'}</p>
                    <p className="text-sm text-gray-500">{entry.reason || 'Adjustment'}</p>
                    <p className="text-sm text-gray-500">{entry.quantity_change >= 0 ? 'Increase' : 'Decrease'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${entry.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {inventoryLogs.length === 0 && (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No stock movements recorded</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Inventory
