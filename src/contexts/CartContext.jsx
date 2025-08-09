import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/format'
import useSystemSettings from '../utils/systemSettings'
// import { setOfflineData, getOfflineData } from '../lib/supabase'

// Temporary functions to replace supabase offline functions
const setOfflineData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

const getOfflineData = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.warn('Failed to get from localStorage:', e)
    return null
  }
}

const CartContext = createContext({})

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.product_id === action.payload.product_id)
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product_id === action.payload.product_id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, id: uuidv4() }]
      }
    }
    
    case 'UPDATE_ITEM': {
      return {
        ...state,
        items: state.items.map(item =>
          item.product_id === action.payload.product_id
            ? { ...item, ...action.payload }
            : item
        )
      }
    }
    
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.product_id !== action.payload.product_id)
      }
    }
    
    case 'CLEAR_CART': {
      return {
        ...state,
        items: [],
        customer: null,
        discount: 0,
        tax_rate: 0,
        notes: ''
      }
    }
    
    case 'SET_CUSTOMER': {
      return {
        ...state,
        customer: action.payload
      }
    }
    
    case 'SET_DISCOUNT': {
      return {
        ...state,
        discount: action.payload
      }
    }
    
    case 'SET_TAX_RATE': {
      return {
        ...state,
        tax_rate: action.payload
      }
    }
    
    case 'SET_NOTES': {
      return {
        ...state,
        notes: action.payload
      }
    }
    
    case 'LOAD_CART': {
      return action.payload
    }
    
    default:
      return state
  }
}

const initialState = {
  items: [],
  customer: null,
  discount: 0,
  tax_rate: 0.1, // 10% default tax
  notes: ''
}

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState)
  const { settings } = useSystemSettings()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = getOfflineData('cart')
    if (savedCart) {
      dispatch({ type: 'LOAD_CART', payload: savedCart })
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    setOfflineData('cart', cart)
  }, [cart])

  // Initialize/Sync tax rate from system settings (percentage -> internal decimal)
  useEffect(() => {
    if (settings && settings.taxRate != null) {
      // setTaxRate expects percentage value [0..100]
      const pct = Number(settings.taxRate) * 100
      const clamped = Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct))
      dispatch({ type: 'SET_TAX_RATE', payload: clamped / 100 })
    }
  }, [settings?.taxRate])

  const addItem = (product, quantity = 1, price = null) => {
    if (!product || quantity <= 0) {
      toast.error('Invalid product or quantity')
      return
    }

    // Check stock availability
    if (product.stock_quantity < quantity) {
      toast.error(`Only ${product.stock_quantity} items available in stock`)
      return
    }

    const cartItem = {
      product_id: product.id,
      name: product.name,
      price: price || product.selling_price,
      quantity,
      sku: product.sku,
      image_url: product.image_url,
      category: product.category
    }

    dispatch({ type: 'ADD_ITEM', payload: cartItem })
    toast.success(`${product.name} (${formatCurrency(cartItem.price)}) added to cart`)
  }

  const updateItem = (productId, updates) => {
    const item = cart.items.find(item => item.product_id === productId)
    if (!item) {
      toast.error('Item not found in cart')
      return
    }

    if (updates.quantity !== undefined && updates.quantity <= 0) {
      removeItem(productId)
      return
    }

    dispatch({ 
      type: 'UPDATE_ITEM', 
      payload: { product_id: productId, ...updates } 
    })
  }

  const removeItem = (productId) => {
    const item = cart.items.find(item => item.product_id === productId)
    if (item) {
      dispatch({ type: 'REMOVE_ITEM', payload: { product_id: productId } })
      toast.success(`${item.name} removed from cart`)
    }
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    toast.success('Cart cleared')
  }

  const setCustomer = (customer) => {
    dispatch({ type: 'SET_CUSTOMER', payload: customer })
  }

  const setDiscount = (discount) => {
    const discountValue = Math.max(0, Math.min(100, discount))
    dispatch({ type: 'SET_DISCOUNT', payload: discountValue })
  }

  const setTaxRate = (taxRate) => {
    const taxValue = Math.max(0, Math.min(100, taxRate))
    dispatch({ type: 'SET_TAX_RATE', payload: taxValue / 100 })
  }

  const setNotes = (notes) => {
    dispatch({ type: 'SET_NOTES', payload: notes })
  }

  // Calculated values
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = (subtotal * cart.discount) / 100
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * cart.tax_rate
  const total = taxableAmount + taxAmount
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  const totals = {
    subtotal,
    discount: cart.discount,
    discountAmount,
    taxRate: cart.tax_rate * 100,
    taxAmount,
    total,
    itemCount
  }

  const value = {
    cart,
    totals,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    setCustomer,
    setDiscount,
    setTaxRate,
    setNotes
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
