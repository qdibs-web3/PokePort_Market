import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { User, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react'

const UserAccount = ({ user }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserOrders()
    }
  }, [user])

  const loadUserOrders = async () => {
    try {
      const response = await fetch(`/api/orders/user/${user.wallet_address}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Please connect your wallet</h3>
        <p className="text-gray-600">You need to connect your wallet to view your account</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600">Manage your profile and view your order history</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Your wallet and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <p className="text-lg text-gray-900">{user.username}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Wallet Address</label>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {user.wallet_address}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Account Type</label>
                <div className="flex items-center space-x-2">
                  <Badge className={user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                    {user.is_admin ? 'Admin' : 'Customer'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Member Since</label>
                <p className="text-gray-900">{formatDate(user.created_at)}</p>
              </div>
              
              {user.last_login && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Login</label>
                  <p className="text-gray-900">{formatDate(user.last_login)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Order History</span>
              </CardTitle>
              <CardDescription>
                Track your purchases and order status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600">Start shopping to see your orders here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Order #{order.id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <Badge className={`flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </Badge>
                      </div>
                      
                      {order.card && (
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center">
                            {order.card.image_url ? (
                              <img 
                                src={order.card.image_url} 
                                alt={order.card.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{order.card.name}</h5>
                            <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                            <p className="text-sm text-gray-600">
                              {order.card.set_name} • {order.card.condition}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">
                              {order.total_price_eth} ETH
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {order.transaction_hash && (
                        <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                          TX: {order.transaction_hash}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UserAccount

