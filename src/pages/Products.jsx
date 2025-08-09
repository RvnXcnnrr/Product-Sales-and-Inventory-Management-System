import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  Save,
  X
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import supabase from '../lib/supabase'
import { formatCurrency } from '../utils/format'
import { useAuth } from '../contexts/AuthContext'

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const { profile, loading: authLoading } = useAuth()

  // Products from database
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [categories, setCategories] = useState(['all'])
  const [categoryMap, setCategoryMap] = useState(new Map())
  const [categoriesData, setCategoriesData] = useState([])

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!profile?.store_id) {
          if (isMounted) {
            setProducts([])
            setCategories(['all'])
            setCategoriesData([])
          }
          return
        }

        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, category_id, created_at, updated_at')
          .eq('store_id', profile.store_id)
          .order('updated_at', { ascending: false })

        if (prodErr) throw prodErr

        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('id, name')
          .eq('store_id', profile.store_id)
          .order('name')

        if (catErr) throw catErr

        if (!isMounted) return
        setProducts(prodData || [])
        const map = new Map((catData || []).map(c => [c.id, c.name]))
        setCategoryMap(map)
        setCategoriesData(catData || [])
        setCategories(['all', ...Array.from(new Set((prodData || []).map(p => map.get(p.category_id)).filter(Boolean)))])
      } catch (e) {
        if (!isMounted) return
        console.error('Failed to load products:', e)
        setError('Failed to load products')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    if (!authLoading) {
      fetchData()
    } else {
      setLoading(true)
    }
    return () => { isMounted = false }
  }, [authLoading, profile?.store_id])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors }
  } = useForm()

  // Quick SKU generator if left blank
  const generateSku = (name = '') => {
    const prefix = (name || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 6) || 'SKU'
    const suffix = Date.now().toString(36).toUpperCase().slice(-5)
    return `${prefix}-${suffix}`
  }

  // Quick add category via prompt
  const addCategoryQuick = async () => {
    try {
      // Resolve store_id from profile or store_users mapping
      let targetStoreId = profile?.store_id || null
      if (!targetStoreId && profile?.id) {
        const { data: su, error: suErr } = await supabase
          .from('store_users')
          .select('store_id')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()
        if (suErr && suErr.code !== 'PGRST116') throw suErr
        if (su?.store_id) targetStoreId = su.store_id
      }
      if (!targetStoreId) {
        toast.error('No store mapping found for your account')
        return
      }
      const name = window.prompt('Enter new category name')
      if (!name || !name.trim()) return
      const { data: newCat, error: catErr } = await supabase
        .from('categories')
        .insert([{ name: name.trim(), store_id: targetStoreId }])
        .select()
        .single()
      if (catErr) throw catErr
      setCategoriesData(prev => [...prev, newCat])
      setCategoryMap(prev => new Map(prev).set(newCat.id, newCat.name))
      // set selected category in form
      setValue('category_id', newCat.id)
      toast.success('Category added')
    } catch (e) {
      console.error('Failed to add category:', e)
      // Permission or RLS error
      if (e?.code === '42501' || e?.message?.toLowerCase?.().includes('permission') || e?.message?.toLowerCase?.().includes('policy')) {
        toast.error('You do not have permission to add categories')
      } else {
        toast.error('Failed to add category')
      }
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode || '').includes(searchTerm)
    const productCatName = categoryMap.get(product.category_id)
    const matchesCategory = selectedCategory === 'all' || productCatName === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = async (data) => {
    try {
      if (!profile?.store_id) {
        toast.error('No store selected')
        return
      }
      // Normalize and auto-generate SKU if empty
      let sku = (data.sku || '').trim()
      if (!sku) {
        sku = generateSku(data.name)
      }

      // Pre-check duplicate SKU in this store
      const { data: existingSku, error: skuErr } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', profile.store_id)
        .eq('sku', sku)
        .maybeSingle()
      if (skuErr && skuErr.code !== 'PGRST116') {
        // PGRST116 is no rows when using single/maybeSingle
        throw skuErr
      }
      if (existingSku) {
        toast.error('SKU already exists in your store')
        return
      }

      const payload = {
        ...data,
        sku,
        cost_price: parseFloat(data.cost_price),
        selling_price: parseFloat(data.selling_price),
        stock_quantity: parseInt(data.stock_quantity),
        min_stock_level: parseInt(data.min_stock_level),
        store_id: profile?.store_id || null
      }
      const { data: inserted, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
      if (error) {
        // Handle unique violation gracefully
        if (error.code === '23505') {
          toast.error('SKU already exists')
          return
        }
        throw error
      }
      // Log initial stock if any
      const created = inserted?.[0]
      if (created && payload.stock_quantity > 0) {
        try {
          await supabase.from('inventory_logs').insert([{
            product_id: created.id,
            store_id: profile.store_id,
            type: 'stock_in',
            quantity_change: payload.stock_quantity,
            previous_quantity: 0,
            new_quantity: payload.stock_quantity,
            reason: 'initial_stock',
            notes: 'Initial stock on product creation',
            created_by: profile.id
          }])
        } catch (logErr) {
          console.warn('Inventory log failed:', logErr)
        }
      }
      setProducts([...(inserted || []), ...products])
      setShowAddProduct(false)
      reset()
      toast.success('Product added successfully!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to add product')
    }
  }

  const handleEditProduct = async (data) => {
    try {
      // Ensure SKU cannot be blank on edit
      const nextSku = (data.sku || '').trim() || editingProduct.sku
      const payload = {
        ...data,
        sku: nextSku,
        cost_price: parseFloat(data.cost_price),
        selling_price: parseFloat(data.selling_price),
        stock_quantity: parseInt(data.stock_quantity),
        min_stock_level: parseInt(data.min_stock_level)
      }
      const { data: updated, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id)
        .select()
      if (error) throw error
      const updatedProducts = products.map(p => p.id === editingProduct.id ? updated[0] : p)
      setProducts(updatedProducts)
      setEditingProduct(null)
      reset()
      toast.success('Product updated successfully!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to update product')
    }
  }

  const handleDeleteProduct = (productId) => {
    setConfirmDeleteId(productId)
  }
  const confirmDelete = () => {
    if (confirmDeleteId == null) return
    // Delete in DB then update state
    supabase.from('products').delete().eq('id', confirmDeleteId)
      .then(({ error }) => {
        if (error) {
          console.error(error)
          toast.error('Failed to delete product')
        } else {
          setProducts(products.filter(product => product.id !== confirmDeleteId))
          toast.success('Product deleted successfully!')
        }
  })
  }

  const getStockStatus = (product) => {
    if (product.stock_quantity === 0) {
      return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' }
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100' }
    }
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' }
  }

  const ProductForm = ({ product, onSubmit, onCancel }) => {
    const cost = parseFloat(watch('cost_price') || 0)
    const price = parseFloat(watch('selling_price') || 0)
    const margin = Math.max(price - cost, 0)
    const marginPct = price > 0 ? (margin / price) * 100 : 0
    const isEditing = !!product
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Product Name *</label>
            <input
              {...register('name', { required: 'Product name is required' })}
              className="input"
              defaultValue={product?.name}
              placeholder="Enter product name"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">SKU {isEditing ? '*' : ''}</label>
            <input
              {...register('sku')}
              className="input"
              defaultValue={product?.sku}
              placeholder={isEditing ? 'Enter SKU' : 'Leave blank to auto-generate'}
            />
            {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku.message}</p>}
          </div>

          <div>
            <label className="label">Barcode</label>
            <input
              {...register('barcode')}
              className="input"
              defaultValue={product?.barcode}
              placeholder="Enter barcode"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label">Category *</label>
              <button type="button" onClick={addCategoryQuick} className="text-sm text-primary-600 hover:text-primary-500 inline-flex items-center">
                <Plus className="w-3 h-3 mr-1" /> Add new
              </button>
            </div>
            <select
              {...register('category_id', { required: 'Category is required' })}
              className="input"
              defaultValue={product?.category_id || ''}
            >
              <option value="">Select category</option>
              {categoriesData.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-sm text-red-600 mt-1">{errors.category_id.message}</p>}
          </div>

          <div>
            <label className="label">Cost Price *</label>
            <input
              type="number"
              step="0.01"
              {...register('cost_price', {
                required: 'Cost price is required',
                min: { value: 0, message: 'Cost price must be positive' }
              })}
              className="input"
              defaultValue={product?.cost_price}
              placeholder="0.00"
            />
            {errors.cost_price && <p className="text-sm text-red-600 mt-1">{errors.cost_price.message}</p>}
          </div>

          <div>
            <label className="label">Selling Price *</label>
            <input
              type="number"
              step="0.01"
              {...register('selling_price', {
                required: 'Selling price is required',
                min: { value: 0, message: 'Selling price must be positive' },
                validate: (v) => parseFloat(v || 0) >= parseFloat(getValues('cost_price') || 0) || 'Selling must be greater than or equal to cost'
              })}
              className="input"
              defaultValue={product?.selling_price}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">Margin: {formatCurrency(margin)} ({marginPct.toFixed(1)}%)</p>
            {errors.selling_price && <p className="text-sm text-red-600 mt-1">{errors.selling_price.message}</p>}
          </div>

          <div>
            <label className="label">Stock Quantity *</label>
            <input
              type="number"
              {...register('stock_quantity', {
                required: 'Stock quantity is required',
                min: { value: 0, message: 'Stock quantity must be positive' }
              })}
              className="input"
              defaultValue={product?.stock_quantity}
              placeholder="0"
            />
            {errors.stock_quantity && <p className="text-sm text-red-600 mt-1">{errors.stock_quantity.message}</p>}
          </div>

          <div>
            <label className="label">Minimum Stock Level</label>
            <input
              type="number"
              {...register('min_stock_level', {
                min: { value: 0, message: 'Minimum stock must be positive' }
              })}
              className="input"
              defaultValue={product?.min_stock_level || 0}
              placeholder="0"
            />
            {errors.min_stock_level && <p className="text-sm text-red-600 mt-1">{errors.min_stock_level.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            {...register('description')}
            className="input h-24 resize-none"
            defaultValue={product?.description}
            placeholder="Enter product description"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-md"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-md"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalog and inventory
          </p>
        </div>
        <button
          onClick={() => setShowAddProduct(true)}
          className="btn btn-primary btn-md mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
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
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td className="table-cell p-6" colSpan="7">Loading...</td></tr>
              ) : error ? (
                <tr><td className="table-cell p-6 text-red-600" colSpan="7">{error}</td></tr>
              ) : filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm font-mono">{product.sku}</div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">{categoryMap.get(product.category_id) || 'Uncategorized'}</span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(product.selling_price)}</div>
                        <div className="text-gray-500">Cost: {formatCurrency(product.cost_price)}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <div className="font-medium">{product.stock_quantity}</div>
                        <div className="text-gray-500">Min: {product.min_stock_level}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status === 'out' ? 'Out of Stock' :
                         stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewingProduct(product)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            reset(product)
                          }}
                          className="text-gray-400 hover:text-green-600 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

  {filteredProducts.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or add a new product</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProduct}
        onClose={() => {
          setShowAddProduct(false)
          reset()
        }}
        title="Add New Product"
        size="lg"
      >
        <ProductForm
          onSubmit={handleAddProduct}
          onCancel={() => {
            setShowAddProduct(false)
            reset()
          }}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => {
          setEditingProduct(null)
          reset()
        }}
        title="Edit Product"
        size="lg"
      >
        <ProductForm
          product={editingProduct}
          onSubmit={handleEditProduct}
          onCancel={() => {
            setEditingProduct(null)
            reset()
          }}
        />
      </Modal>

      {/* View Product Modal */}
      <Modal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        title="Product Details"
        size="md"
      >
        {viewingProduct && (
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                {viewingProduct.image_url ? (
                  <img 
                    src={viewingProduct.image_url} 
                    alt={viewingProduct.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewingProduct.name}</h3>
                <p className="text-gray-500">{categoryMap.get(viewingProduct.category_id) || 'Uncategorized'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">SKU</label>
                <p className="font-mono">{viewingProduct.sku}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Barcode</label>
                <p className="font-mono">{viewingProduct.barcode || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Cost Price</label>
                <p>{formatCurrency(viewingProduct.cost_price)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Selling Price</label>
                <p className="font-semibold">{formatCurrency(viewingProduct.selling_price)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Stock Quantity</label>
                <p>{viewingProduct.stock_quantity}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Min Stock Level</label>
                <p>{viewingProduct.min_stock_level}</p>
              </div>
            </div>

            {viewingProduct.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{viewingProduct.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <label className="font-medium">Created</label>
                <p>{new Date(viewingProduct.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="font-medium">Last Updated</label>
                <p>{new Date(viewingProduct.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteId != null}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete product?"
        description="This action cannot be undone. The product will be removed from your catalog."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

export default Products
