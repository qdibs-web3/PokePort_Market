import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import '../celebration-animations.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { User, Package, Clock, CheckCircle, Truck, XCircle, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

const UserAccount = ({ user, onCardPurchase }) => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'profile')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [purchasedItems, setPurchasedItems] = useState([])
  const [transactionHash, setTransactionHash] = useState('')
  const [showDisplayNameForm, setShowDisplayNameForm] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState('')
  const [displayNameLoading, setDisplayNameLoading] = useState(false)
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart()
  
  // Update active tab when location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab)
    }
  }, [location])
  
  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: ''
  })

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

  const handleCheckout = async (e) => {
    e.preventDefault()
    
    if (items.length === 0) {
      alert('Your cart is empty!')
      return
    }

    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.address) {
      alert('Please fill in all required fields!')
      return
    }

    setCheckoutLoading(true)
    
    try {
      // Create orders for each item in cart
      const orderPromises = items.map(async (item) => {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            card_id: item.id,
            quantity: item.quantity,
            buyer_wallet_address: user.wallet_address,
          }),
        })

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json()
          throw new Error(errorData.error || 'Failed to create order')
        }

        return await orderResponse.json()
      })

      const orders = await Promise.all(orderPromises)
      const totalPrice = getTotalPrice()

      // Request payment through MetaMask
      const adminWallet = '0xf08d3184c50a1B255507785F71c9330034852Cd5'
      
      const transactionParameters = {
        to: adminWallet,
        from: user.wallet_address,
        value: '0x' + (totalPrice * Math.pow(10, 18)).toString(16), // Convert ETH to Wei in hex
        gas: '0x5208', // 21000 in hex
      }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      })

      // Confirm all orders with transaction hash
      await Promise.all(orders.map(order => 
        fetch(`/api/orders/${order.id}/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            transaction_hash: txHash,
            customer_info: checkoutForm
          }),
        })
      ))

      // Send email notification to admin
      await fetch('/api/orders/notify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orders,
          customer_info: checkoutForm,
          transaction_hash: txHash,
          total_price_eth: totalPrice
        }),
      })

      // Show celebration popup
      setPurchasedItems([...items])
      setTransactionHash(txHash)
      setShowCelebration(true)
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        setShowCelebration(false)
      }, 8000)
      
      clearCart()
      setCheckoutForm({
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: ''
      })
      loadUserOrders() // Refresh orders
      if (onCardPurchase) {
        onCardPurchase() // Refresh card stock on market page
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed: ' + error.message)
    } finally {
      setCheckoutLoading(false)
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

  const handleUpdateDisplayName = async (e) => {
    e.preventDefault()
    
    if (!newDisplayName.trim()) {
      alert('Please enter a display name')
      return
    }
    
    if (newDisplayName.length > 16) {
      alert('Display name must be 16 characters or less')
      return
    }
    
    setDisplayNameLoading(true)
    
    try {
      const response = await fetch('/api/users/update-display-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          display_name: newDisplayName
        }),
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        // Update user in parent component (App.jsx)
        window.location.reload() // Simple reload to refresh user data
        alert('Display name updated successfully!')
        setShowDisplayNameForm(false)
        setNewDisplayName('')
      } else {
        const errorData = await response.json()
        alert('Failed to update display name: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating display name:', error)
      alert('Error updating display name: ' + error.message)
    } finally {
      setDisplayNameLoading(false)
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Please connect your wallet</h3>
        <p className="text-gray-600">You need to connect your wallet to view your account</p>
      </div>
    )
  }

  return (
    <>
      {/* Celebration Popup */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCelebration(false)}></div>
          
          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 6)],
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Popup Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-bounce-in">
            {/* Close Button */}
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 Purchase Successful!</h2>
              <p className="text-gray-600">Your order has been confirmed</p>
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary:</h3>
              {purchasedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between mb-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-gray-600">x{item.quantity}</span>
                </div>
              ))}
              
              {/* Transaction Hash */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Transaction:</p>
                <a
                  href={`https://etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-mono text-xs underline break-all"
                >
                  {transactionHash}
                </a>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowCelebration(false)
                  setActiveTab('orders')
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Orders
              </Button>
              <Button
                onClick={() => setShowCelebration(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your profile and view your order history</p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="cart">Cart ({items.length})</TabsTrigger>
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <p className="text-lg text-gray-900 dark:text-gray-100">{user.username}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                <p className="text-lg text-gray-900 dark:text-gray-100 mb-2">{user.display_name || 'Not set'}</p>
                {!showDisplayNameForm ? (
                  <Button 
                    onClick={() => setShowDisplayNameForm(true)}
                    variant="outline"
                    size="sm"
                    className="mt-1"
                  >
                    Update Display Name
                  </Button>
                ) : (
                  <form onSubmit={handleUpdateDisplayName} className="space-y-3 mt-2">
                    <div>
                      <Input
                        type="text"
                        placeholder="Enter display name (max 16 characters)"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        maxLength={16}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {newDisplayName.length}/16 characters
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={displayNameLoading}
                      >
                        {displayNameLoading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDisplayNameForm(false)
                          setNewDisplayName('')
                        }}
                        disabled={displayNameLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Address</label>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {user.wallet_address}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                <div className="flex items-center space-x-2">
                  <Badge className={user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                    {user.is_admin ? 'Admin' : 'Fren'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(user.created_at)}</p>
              </div>
              
              {user.last_login && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Login</label>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(user.last_login)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cart">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Shopping Cart</span>
              </CardTitle>
              <CardDescription>
                Review items in your cart before checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600">Add some cards to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.price_eth} ETH each</p>
                        <p className="text-sm text-gray-600">{item.set_name} • {item.condition}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_quantity}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          {(item.price_eth * item.quantity).toFixed(4)} ETH
                        </p>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                          className="mt-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-blue-600">{getTotalPrice().toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkout">
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>
                Complete your purchase with shipping information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600">Add items to your cart before checkout!</p>
                </div>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm({...checkoutForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Shipping Address *</Label>
                    <Textarea
                      id="address"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                      required
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={checkoutForm.state}
                        onChange={(e) => setCheckoutForm({...checkoutForm, state: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={checkoutForm.zipCode}
                        onChange={(e) => setCheckoutForm({...checkoutForm, zipCode: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={checkoutForm.country}
                        onChange={(e) => setCheckoutForm({...checkoutForm, country: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold mb-2">Order Summary</h4>
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm mb-1">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{(item.price_eth * item.quantity).toFixed(4)} ETH</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span className="text-blue-600">{getTotalPrice().toFixed(4)} ETH</span>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? 'Processing...' : `Pay ${getTotalPrice().toFixed(4)} ETH`}
                    </Button>
                  </div>
                </form>
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
                <Tabs defaultValue="in-progress" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>

                  <TabsContent value="in-progress" className="space-y-4 mt-4">
                    {orders.filter(order => order.status === 'pending' || order.status === 'confirmed').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No in-progress orders</p>
                      </div>
                    ) : (
                      orders.filter(order => order.status === 'pending' || order.status === 'confirmed').map((order) => (
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
                        <div className="text-xs bg-gray-50 p-2 rounded mb-2">
                          <span className="text-gray-500">Transaction: </span>
                          <a 
                            href={`https://etherscan.io/tx/${order.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-mono underline"
                          >
                            {order.transaction_hash.slice(0, 10)}...{order.transaction_hash.slice(-8)}
                          </a>
                          <span className="text-gray-400 ml-2 text-xs">↗ View on Etherscan</span>
                        </div>
                      )}
                      
                      {order.customer_info && (
                        <div className="text-xs bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="font-semibold text-gray-700 mb-1">📦 Shipping Information:</p>
                          <p className="text-gray-600">{order.customer_info.name}</p>
                          <p className="text-gray-600">{order.customer_info.address}</p>
                          <p className="text-gray-600">{order.customer_info.city}, {order.customer_info.state} {order.customer_info.zipCode}</p>
                          <p className="text-gray-600">{order.customer_info.country}</p>
                          {order.customer_info.phone && (
                            <p className="text-gray-600 mt-1">📞 {order.customer_info.phone}</p>
                          )}
                        </div>
                      )}
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4 mt-4">
                    {orders.filter(order => order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No completed orders</p>
                      </div>
                    ) : (
                      orders.filter(order => order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled').map((order) => (
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
                            <div className="text-xs bg-gray-50 p-2 rounded mb-2">
                              <span className="text-gray-500">Transaction: </span>
                              <a 
                                href={`https://etherscan.io/tx/${order.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-mono underline"
                              >
                                {order.transaction_hash.slice(0, 10)}...{order.transaction_hash.slice(-8)}
                              </a>
                              <span className="text-gray-400 ml-2 text-xs">↗ View on Etherscan</span>
                            </div>
                          )}
                          
                          {order.customer_info && (
                            <div className="text-xs bg-blue-50 p-3 rounded border border-blue-200">
                              <p className="font-semibold text-gray-700 mb-1">📦 Shipping Information:</p>
                              <p className="text-gray-600">{order.customer_info.name}</p>
                              <p className="text-gray-600">{order.customer_info.address}</p>
                              <p className="text-gray-600">{order.customer_info.city}, {order.customer_info.state} {order.customer_info.zipCode}</p>
                              <p className="text-gray-600">{order.customer_info.country}</p>
                              {order.customer_info.phone && (
                                <p className="text-gray-600 mt-1">📞 {order.customer_info.phone}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}
export default UserAccount