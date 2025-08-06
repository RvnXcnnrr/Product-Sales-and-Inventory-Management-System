import React from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  AlertTriangle,
  Calendar,
  Eye
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  // Mock data - will be replaced with real API calls
  const stats = [
    {
      title: 'Today\'s Sales',
      value: '$2,847',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Products',
      value: '1,234',
      change: '+8',
      changeType: 'positive',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Transactions',
      value: '89',
      change: '+23%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'bg-purple-500'
    },
    {
      title: 'Low Stock Items',
      value: '12',
      change: '+3',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'bg-orange-500'
    }
  ]

  const recentTransactions = [
    {
      id: 1,
      customer: 'John Doe',
      amount: 125.50,
      items: 3,
      time: '2 minutes ago',
      status: 'completed'
    },
    {
      id: 2,
      customer: 'Sarah Wilson',
      amount: 87.25,
      items: 2,
      time: '15 minutes ago',
      status: 'completed'
    },
    {
      id: 3,
      customer: 'Mike Johnson',
      amount: 234.75,
      items: 5,
      time: '32 minutes ago',
      status: 'completed'
    },
    {
      id: 4,
      customer: 'Emma Brown',
      amount: 156.00,
      items: 4,
      time: '1 hour ago',
      status: 'completed'
    }
  ]

  const lowStockProducts = [
    {
      id: 1,
      name: 'iPhone 13 Pro',
      sku: 'IPH13P-256',
      currentStock: 2,
      minStock: 5,
      price: 999.99
    },
    {
      id: 2,
      name: 'Samsung Galaxy S22',
      sku: 'SGS22-128',
      currentStock: 1,
      minStock: 3,
      price: 699.99
    },
    {
      id: 3,
      name: 'MacBook Air M2',
      sku: 'MBA-M2-512',
      currentStock: 0,
      minStock: 2,
      price: 1299.99
    }
  ]

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
                          <div className="font-medium text-gray-900">${transaction.amount.toFixed(2)}</div>
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
