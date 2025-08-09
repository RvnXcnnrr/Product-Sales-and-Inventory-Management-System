import React, { useState } from 'react'
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

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [showStockUpdate, setShowStockUpdate] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [pendingAdjustment, setPendingAdjustment] = useState(null)
  const [showConfirmAdjustment, setShowConfirmAdjustment] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  // Mock inventory data
  const [inventory, setInventory] = useState([
    {
      id: 1,
      name: 'iPhone 13 Pro',
      sku: 'IPH13P-256',
      category: 'Electronics',
      current_stock: 15,
      min_stock_level: 5,
      max_stock_level: 50,
      cost_price: 799.99,
      selling_price: 999.99,
      total_value: 11999.85,
      last_updated: '2024-01-25T10:30:00Z',
      supplier: 'Apple Inc.',
      location: 'A1-01'
    },
    {
      id: 2,
      name: 'Samsung Galaxy S22',
      sku: 'SGS22-128',
      category: 'Electronics',
      current_stock: 2,
      min_stock_level: 3,
      max_stock_level: 30,
      cost_price: 549.99,
      selling_price: 699.99,
      total_value: 1399.98,
      last_updated: '2024-01-24T14:15:00Z',
      supplier: 'Samsung Electronics',
      location: 'A1-02'
    },
    {
      id: 3,
      name: 'Nike Air Max',
      sku: 'NAM-001',
      category: 'Footwear',
      current_stock: 25,
      min_stock_level: 10,
      max_stock_level: 100,
      cost_price: 89.99,
      selling_price: 129.99,
      total_value: 3249.75,
      last_updated: '2024-01-23T09:45:00Z',
      supplier: 'Nike Inc.',
      location: 'B2-05'
    },
    {
      id: 4,
      name: 'Coca Cola 500ml',
      sku: 'CC-500',
      category: 'Beverages',
      current_stock: 100,
      min_stock_level: 50,
      max_stock_level: 500,
      cost_price: 1.99,
      selling_price: 2.99,
      total_value: 299.00,
      last_updated: '2024-01-25T16:20:00Z',
      supplier: 'Coca Cola Company',
      location: 'C3-10'
    },
    {
      id: 5,
      name: 'MacBook Air M2',
      sku: 'MBA-M2-512',
      category: 'Electronics',
      current_stock: 0,
      min_stock_level: 2,
      max_stock_level: 20,
      cost_price: 1099.99,
      selling_price: 1299.99,
      total_value: 0,
      last_updated: '2024-01-20T11:30:00Z',
      supplier: 'Apple Inc.',
      location: 'A1-03'
    }
  ])

  // Mock stock history
  const stockHistory = [
    {
      id: 1,
      product_name: 'iPhone 13 Pro',
      type: 'stock_in',
      quantity: 10,
      reason: 'Purchase Order #PO-001',
      user: 'Admin',
      date: '2024-01-25T10:30:00Z'
    },
    {
      id: 2,
      product_name: 'Samsung Galaxy S22',
      type: 'stock_out',
      quantity: -5,
      reason: 'Sale Transaction #TXN-123',
      user: 'Cashier 1',
      date: '2024-01-24T14:15:00Z'
    },
    {
      id: 3,
      product_name: 'MacBook Air M2',
      type: 'stock_out',
      quantity: -3,
      reason: 'Sale Transaction #TXN-122',
      user: 'Cashier 2',
      date: '2024-01-20T11:30:00Z'
    }
  ]

  const categories = ['all', ...new Set(inventory.map(item => item.category))]

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

  const applyStockUpdate = (adjustment) => {
    const updatedInventory = inventory.map(item =>
      item.id === selectedProduct.id
        ? {
            ...item,
            current_stock: Math.max(0, item.current_stock + adjustment),
            total_value: (item.current_stock + adjustment) * item.cost_price,
            last_updated: new Date().toISOString()
          }
        : item
    )

    setInventory(updatedInventory)
    setShowStockUpdate(false)
    setSelectedProduct(null)
    reset()
    
    const actionType = adjustment > 0 ? 'increased' : 'decreased'
    toast.success(`Stock ${actionType} successfully!`)
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

        {filteredInventory.length === 0 && (
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
            {stockHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${entry.type === 'stock_in' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {entry.type === 'stock_in' ? (
                      <Plus className={`w-4 h-4 ${entry.type === 'stock_in' ? 'text-green-600' : 'text-red-600'}`} />
                    ) : (
                      <Minus className={`w-4 h-4 ${entry.type === 'stock_in' ? 'text-green-600' : 'text-red-600'}`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{entry.product_name}</p>
                    <p className="text-sm text-gray-500">{entry.reason}</p>
                    <p className="text-sm text-gray-500">by {entry.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${entry.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {stockHistory.length === 0 && (
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
