import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Trash2, 
  CreditCard,
  DollarSign,
  Minus,
  Calculator
} from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/format'
import supabase from '../lib/supabase'

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountReceived, setAmountReceived] = useState('')
  const [processing, setProcessing] = useState(false)
  const [confirmClearCart, setConfirmClearCart] = useState(false)
  const [confirmRemoveItemId, setConfirmRemoveItemId] = useState(null)
  
  const { cart, totals, addItem, updateItem, removeItem, clearCart } = useCart()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load products and categories from database
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryMap, setCategoryMap] = useState(new Map())

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch products
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('id, name, sku, barcode, selling_price, stock_quantity, image_url, category_id')
          .order('name', { ascending: true })

        if (prodErr) throw prodErr

        // Fetch categories to resolve names for filter
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })

        if (catErr) throw catErr

        if (!isMounted) return
        setProducts(prodData || [])
  const catMap = new Map((catData || []).map(c => [c.id, c.name]))
  setCategoryMap(catMap)
  const uniqueCats = Array.from(new Set((prodData || []).map(p => catMap.get(p.category_id)).filter(Boolean)))
  setCategories(['all', ...uniqueCats])
      } catch (e) {
        if (!isMounted) return
        console.error('Failed to load products/categories:', e)
        setError('Failed to load products')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode || '').includes(searchTerm)
    const productCatName = categoryMap.get(product.category_id)
    const matchesCategory = selectedCategory === 'all' || productCatName === selectedCategory
    return matchesSearch && matchesCategory && product.stock_quantity > 0
  })

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setConfirmRemoveItemId(productId)
    } else {
      updateItem(productId, { quantity: newQuantity })
    }
  }

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived)
      if (!received || received < totals.total) {
        toast.error('Insufficient amount received')
        return
      }
    }

    setProcessing(true)
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would make an API call to process the transaction
      console.log('Processing transaction:', {
        items: cart.items,
        totals,
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? parseFloat(amountReceived) : totals.total
      })
      
      toast.success('Transaction completed successfully!')
      clearCart()
      setShowCheckout(false)
      setAmountReceived('')
      setPaymentMethod('cash')
    } catch (error) {
      toast.error('Transaction failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const change = paymentMethod === 'cash' && amountReceived 
    ? Math.max(0, parseFloat(amountReceived) - totals.total)
    : 0

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Product Selection */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
          <div className="mt-4 sm:mt-0">
            <span className="text-sm text-gray-500">
              {filteredProducts.length} products available
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input w-full sm:w-auto"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-12"><LoadingSpinner /></div>
          ) : error ? (
            <div className="col-span-full text-center text-red-600 py-6">{error}</div>
          ) : filteredProducts.map((product) => (
            <div key={product.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-4xl">📦</div>
                )}
              </div>
              
              <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(product.selling_price)}
                </span>
                <span className="text-sm text-gray-500">
                  {product.stock_quantity} in stock
                </span>
              </div>
              
              <button
                onClick={() => addItem(product, 1)}
                className="btn btn-primary btn-sm w-full"
                disabled={product.stock_quantity === 0}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add to Cart
              </button>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="lg:w-80 xl:w-96">
        <div className="card h-full flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart ({totals.itemCount})
              </h2>
        {cart.items.length > 0 && (
                <button
          onClick={() => setConfirmClearCart(true)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-sm text-gray-400">Add products to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📦</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                            <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setConfirmRemoveItemId(item.product_id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.items.length > 0 && (
            <>
              <div className="border-t border-gray-200 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({totals.discount}%):</span>
                    <span>-{formatCurrency(totals.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax ({totals.taxRate}%):</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="btn btn-primary btn-lg w-full"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Complete Transaction"
        size="md"
      >
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(totals.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Card</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="label">Amount Received</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="input"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              
              {amountReceived && parseFloat(amountReceived) >= totals.total && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Change Due:</span>
                    <span className="text-xl font-bold text-green-800">
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCheckout(false)}
              className="btn btn-secondary btn-md flex-1"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={processing || (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < totals.total))}
              className="btn btn-primary btn-md flex-1"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                'Complete Sale'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm clear cart */}
      <ConfirmDialog
        isOpen={confirmClearCart}
        onCancel={() => setConfirmClearCart(false)}
        onConfirm={() => { clearCart(); setConfirmClearCart(false) }}
        title="Clear cart?"
        description="This will remove all items from the cart. You can't undo this action."
        confirmText="Clear"
        variant="danger"
      />

      {/* Confirm remove single item */}
      <ConfirmDialog
        isOpen={confirmRemoveItemId != null}
        onCancel={() => setConfirmRemoveItemId(null)}
        onConfirm={() => { if (confirmRemoveItemId != null) removeItem(confirmRemoveItemId); setConfirmRemoveItemId(null) }}
        title="Remove item?"
        description="This item will be removed from the cart."
        confirmText="Remove"
        variant="danger"
      />
    </div>
  )
}

export default Sales
