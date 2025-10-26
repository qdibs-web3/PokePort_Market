import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { 
  Plus, 
  Edit, 
  Trash2, 
  BarChart3, 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react'

const AdminPanel = ({ user, onCardUpdate }) => {
  const [cards, setCards] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [productFormTab, setProductFormTab] = useState('card') // 'card' or 'gc' (graded card)
  const [adminWallets, setAdminWallets] = useState(['0xf08d3184c50a1B255507785F71c9330034852Cd5'])
  const [newWallet, setNewWallet] = useState('')
  const [newCard, setNewCard] = useState({
    name: '',
    description: '',
    price_eth: '',
    image_url: '',
    image_urls: [''],
    rarity: '',
    product_type: 'Card',
    grading_company: '',
    grade: '',
    set_name: '',
    card_number: '',
    condition: '',
    stock_quantity: 1
  })

  useEffect(() => {
    if (user && user.is_admin) {
      loadAdminData()
    }
  }, [user])

  const loadAdminData = async () => {
    try {
      let cardsData = { cards: [] }
      let ordersData = { orders: [] }

      // Load all cards (including inactive)
      const cardsResponse = await fetch('/api/cards?include_inactive=true')
      if (cardsResponse.ok) {
        cardsData = await cardsResponse.json()
        setCards(cardsData.cards || [])
      }

      // Load all orders
      const ordersResponse = await fetch('/api/orders')
      if (ordersResponse.ok) {
        ordersData = await ordersResponse.json()
        setOrders(ordersData.orders || [])
      }

      // Calculate analytics
      calculateAnalytics(cardsData.cards || [], ordersData.orders || [])
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (cardsData, ordersData) => {
    const totalCards = cardsData.length
    const activeCards = cardsData.filter(card => card.is_active === true).length
    const inactiveCards = cardsData.filter(card => card.is_active === false).length
    const totalOrders = ordersData.length
    const confirmedOrders = ordersData.filter(order => 
      order.status === 'confirmed' || 
      order.status === 'shipped' || 
      order.status === 'delivered'
    )
    const totalRevenue = confirmedOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.total_price_eth) || 0)
    }, 0)
    const pendingOrders = ordersData.filter(order => order.status === 'pending').length
    const shippedOrders = ordersData.filter(order => order.status === 'shipped').length
    const deliveredOrders = ordersData.filter(order => order.status === 'delivered').length
    const cancelledOrders = ordersData.filter(order => order.status === 'cancelled').length
    
    // Calculate total stock quantity
    const totalStockQuantity = cardsData.reduce((sum, card) => {
      return sum + (parseInt(card.stock_quantity) || 0)
    }, 0)
    
    // Calculate average order value
    const avgOrderValue = confirmedOrders.length > 0 
      ? (totalRevenue / confirmedOrders.length).toFixed(4)
      : '0.0000'
    
    // Calculate total items sold
    const totalItemsSold = confirmedOrders.reduce((sum, order) => {
      return sum + (parseInt(order.quantity) || 0)
    }, 0)
    
    // Find best selling card (most ordered)
    const cardOrderCount = {}
    ordersData.forEach(order => {
      if (order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered') {
        const cardId = order.card_id
        cardOrderCount[cardId] = (cardOrderCount[cardId] || 0) + (parseInt(order.quantity) || 0)
      }
    })
    
    let bestSellingCardId = null
    let maxSales = 0
    Object.entries(cardOrderCount).forEach(([cardId, count]) => {
      if (count > maxSales) {
        maxSales = count
        bestSellingCardId = cardId
      }
    })
    
    const bestSellingCard = bestSellingCardId 
      ? cardsData.find(card => card.id === bestSellingCardId)
      : null

    setAnalytics({
      totalCards,
      activeCards,
      inactiveCards,
      totalOrders,
      confirmedOrders: confirmedOrders.length,
      totalRevenue: totalRevenue.toFixed(4),
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalStockQuantity,
      avgOrderValue,
      totalItemsSold,
      bestSellingCard,
      bestSellingCardSales: maxSales
    })
  }

  const handleAddCard = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCard,
          price_eth: parseFloat(newCard.price_eth),
          stock_quantity: parseInt(newCard.stock_quantity)
        }),
      })

      if (response.ok) {
        setShowAddCard(false)
        setNewCard({
          name: '',
          description: '',
          price_eth: '',
          image_url: '',
          image_urls: [''],
          rarity: '',
          product_type: 'Card',
          grading_company: '',
          grade: '',
          set_name: '',
          card_number: '',
          condition: '',
          stock_quantity: 1
        })
        setProductFormTab('card')
        loadAdminData()
        onCardUpdate()
        alert('Product added successfully!')
      } else {
        const errorData = await response.json()
        alert('Failed to add product: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error adding card:', error)
      alert('Error adding product: ' + error.message)
    }
  }

  const handleUpdateCard = async (cardId, updates) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        loadAdminData()
        onCardUpdate()
      }
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const handleDeleteCard = async (cardId, cardName) => {
    if (!confirm(`Are you sure you want to permanently delete "${cardName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        alert('Product deleted successfully!')
        loadAdminData()
        onCardUpdate()
      } else {
        const errorData = await response.json()
        alert('Failed to delete product: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('Error deleting product: ' + error.message)
    }
  }

  const handleEditCard = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCard.name,
          description: editingCard.description,
          price_eth: parseFloat(editingCard.price_eth),
          image_url: editingCard.image_url,
          rarity: editingCard.rarity,
          product_type: editingCard.product_type,
          grading_company: editingCard.grading_company,
          grade: editingCard.grade,
          set_name: editingCard.set_name,
          condition: editingCard.condition,
          stock_quantity: parseInt(editingCard.stock_quantity)
        }),
      })

      if (response.ok) {
        setEditingCard(null)
        loadAdminData()
        onCardUpdate()
        alert('Product updated successfully!')
      } else {
        const errorData = await response.json()
        alert('Failed to update product: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating card:', error)
      alert('Error updating product: ' + error.message)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        alert('Order status updated successfully!')
        loadAdminData()
      } else {
        const errorData = await response.json()
        alert('Failed to update order status: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status: ' + error.message)
    }
  }

  const toggleCardActive = (card) => {
    handleUpdateCard(card.id, { is_active: !card.is_active })
  }

  if (!user || !user.is_admin) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h3>
        <p className="text-gray-600">You need admin privileges to access this panel</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-8xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage your Pokemon card marketplace</p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalRevenue} ETH</div>
                <p className="text-xs text-muted-foreground">
                  From {analytics.confirmedOrders} confirmed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeCards}</div>
                <p className="text-xs text-muted-foreground">
                  Out of {analytics.totalCards} total cards
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  All time orders
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.avgOrderValue} ETH</div>
                <p className="text-xs text-muted-foreground">
                  Per confirmed order
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalStockQuantity}</div>
                <p className="text-xs text-muted-foreground">
                  Items in inventory
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalItemsSold}</div>
                <p className="text-xs text-muted-foreground">
                  Total units sold
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Cards</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.inactiveCards}</div>
                <p className="text-xs text-muted-foreground">
                  Not listed on market
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shipped Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.shippedOrders}</div>
                <p className="text-xs text-muted-foreground">
                  In transit
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.deliveredOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully delivered
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.cancelledOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Cancelled by admin
                </p>
              </CardContent>
            </Card>
          </div>
          
          {analytics.bestSellingCard && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Best Selling Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  {analytics.bestSellingCard.image_url && (
                    <img 
                      src={analytics.bestSellingCard.image_url} 
                      alt={analytics.bestSellingCard.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <p className="text-lg font-bold">{analytics.bestSellingCard.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {analytics.bestSellingCardSales} units sold
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {analytics.bestSellingCard.price_eth} ETH each
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cards">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Card Management</h2>
              <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Add a new product to your marketplace inventory
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Product Type Tabs */}
                  <Tabs value={productFormTab} onValueChange={setProductFormTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="card">Card</TabsTrigger>
                      <TabsTrigger value="gc">GC (Graded Card)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="card">
                      <form onSubmit={handleAddCard} className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="product_type">Product Type *</Label>
                          <select
                            id="product_type"
                            value={newCard.product_type}
                            onChange={(e) => setNewCard({...newCard, product_type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="Card">Card</option>
                            <option value="Sealed">Sealed</option>
                            <option value="Custom">Custom</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="name">Product Name *</Label>
                          <Input
                            id="name"
                            value={newCard.name}
                            onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="price">Price (ETH) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.001"
                            value={newCard.price_eth}
                            onChange={(e) => setNewCard({...newCard, price_eth: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="rarity">Rarity</Label>
                          <select
                            id="rarity"
                            value={newCard.rarity}
                            onChange={(e) => setNewCard({...newCard, rarity: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select Rarity</option>
                            <option value="Common">Common</option>
                            <option value="Uncommon">Uncommon</option>
                            <option value="Rare">Rare</option>
                            <option value="Ultra Rare">Ultra Rare</option>
                            <option value="Legendary">Legendary</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="set_name">Set Name</Label>
                          <Input
                            id="set_name"
                            value={newCard.set_name}
                            onChange={(e) => setNewCard({...newCard, set_name: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="condition">Condition</Label>
                          <select
                            id="condition"
                            value={newCard.condition}
                            onChange={(e) => setNewCard({...newCard, condition: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select Condition</option>
                            <option value="Mint">Mint</option>
                            <option value="Near Mint">Near Mint</option>
                            <option value="Lightly Played">Lightly Played</option>
                            <option value="Moderately Played">Moderately Played</option>
                            <option value="Heavily Played">Heavily Played</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="stock">Stock Quantity *</Label>
                          <Input
                            id="stock"
                            type="number"
                            min="1"
                            value={newCard.stock_quantity}
                            onChange={(e) => setNewCard({...newCard, stock_quantity: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="image_url">Image URL</Label>
                          <Input
                            id="image_url"
                            type="url"
                            value={newCard.image_url}
                            onChange={(e) => setNewCard({...newCard, image_url: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newCard.description}
                            onChange={(e) => setNewCard({...newCard, description: e.target.value})}
                            rows={3}
                          />
                        </div>

                        <Button type="submit" className="w-full">Add Product</Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="gc">
                      <form onSubmit={handleAddCard} className="space-y-4 mt-4">
                        <input type="hidden" value="Graded Card" />
                        
                        <div>
                          <Label htmlFor="gc_product_type">Product Type *</Label>
                          <select
                            id="gc_product_type"
                            value="Graded Card"
                            onChange={(e) => setNewCard({...newCard, product_type: 'Graded Card'})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            disabled
                          >
                            <option value="Graded Card">Graded Card</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="gc_name">Product Name *</Label>
                          <Input
                            id="gc_name"
                            value={newCard.name}
                            onChange={(e) => setNewCard({...newCard, name: e.target.value, product_type: 'Graded Card'})}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="gc_price">Price (ETH) *</Label>
                          <Input
                            id="gc_price"
                            type="number"
                            step="0.001"
                            value={newCard.price_eth}
                            onChange={(e) => setNewCard({...newCard, price_eth: e.target.value})}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="grading_company">Grading Company *</Label>
                            <Input
                              id="grading_company"
                              value={newCard.grading_company}
                              onChange={(e) => setNewCard({...newCard, grading_company: e.target.value})}
                              placeholder="e.g., PSA, BGS, CGC"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="grade">Grade *</Label>
                            <Input
                              id="grade"
                              value={newCard.grade}
                              onChange={(e) => setNewCard({...newCard, grade: e.target.value})}
                              placeholder="e.g., 10, 9.5"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="gc_rarity">Rarity</Label>
                          <select
                            id="gc_rarity"
                            value={newCard.rarity}
                            onChange={(e) => setNewCard({...newCard, rarity: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select Rarity</option>
                            <option value="Common">Common</option>
                            <option value="Uncommon">Uncommon</option>
                            <option value="Rare">Rare</option>
                            <option value="Ultra Rare">Ultra Rare</option>
                            <option value="Legendary">Legendary</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="gc_set_name">Set Name</Label>
                          <Input
                            id="gc_set_name"
                            value={newCard.set_name}
                            onChange={(e) => setNewCard({...newCard, set_name: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="gc_stock">Stock Quantity *</Label>
                          <Input
                            id="gc_stock"
                            type="number"
                            min="1"
                            value={newCard.stock_quantity}
                            onChange={(e) => setNewCard({...newCard, stock_quantity: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="gc_image_url">Image URL</Label>
                          <Input
                            id="gc_image_url"
                            type="url"
                            value={newCard.image_url}
                            onChange={(e) => setNewCard({...newCard, image_url: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        <div>
                          <Label htmlFor="gc_description">Description</Label>
                          <Textarea
                            id="gc_description"
                            value={newCard.description}
                            onChange={(e) => setNewCard({...newCard, description: e.target.value})}
                            rows={3}
                          />
                        </div>

                        <Button type="submit" className="w-full">Add Graded Card</Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Card Dialog */}
            <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                  <DialogDescription>
                    Update product information
                  </DialogDescription>
                </DialogHeader>
                {editingCard && (
                  <form onSubmit={(e) => handleEditCard(e)} className="space-y-4">
                    <div>
                      <Label htmlFor="edit-product_type">Product Type</Label>
                      <select
                        id="edit-product_type"
                        value={editingCard.product_type || 'Card'}
                        onChange={(e) => setEditingCard({...editingCard, product_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="Card">Card</option>
                        <option value="Graded Card">Graded Card</option>
                        <option value="Sealed">Sealed</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    {editingCard.product_type === 'Graded Card' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-grading_company">Grading Company</Label>
                          <Input
                            id="edit-grading_company"
                            value={editingCard.grading_company || ''}
                            onChange={(e) => setEditingCard({...editingCard, grading_company: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-grade">Grade</Label>
                          <Input
                            id="edit-grade"
                            value={editingCard.grade || ''}
                            onChange={(e) => setEditingCard({...editingCard, grade: e.target.value})}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="edit-name">Product Name</Label>
                      <Input
                        id="edit-name"
                        value={editingCard.name}
                        onChange={(e) => setEditingCard({...editingCard, name: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-price">Price (ETH)</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.001"
                        value={editingCard.price_eth}
                        onChange={(e) => setEditingCard({...editingCard, price_eth: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-rarity">Rarity</Label>
                      <select
                        id="edit-rarity"
                        value={editingCard.rarity || ''}
                        onChange={(e) => setEditingCard({...editingCard, rarity: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select Rarity</option>
                        <option value="Common">Common</option>
                        <option value="Uncommon">Uncommon</option>
                        <option value="Rare">Rare</option>
                        <option value="Ultra Rare">Ultra Rare</option>
                        <option value="Legendary">Legendary</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="edit-set">Set Name</Label>
                      <Input
                        id="edit-set"
                        value={editingCard.set_name || ''}
                        onChange={(e) => setEditingCard({...editingCard, set_name: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-condition">Condition</Label>
                      <select
                        id="edit-condition"
                        value={editingCard.condition || ''}
                        onChange={(e) => setEditingCard({...editingCard, condition: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select Condition</option>
                        <option value="Mint">Mint</option>
                        <option value="Near Mint">Near Mint</option>
                        <option value="Lightly Played">Lightly Played</option>
                        <option value="Moderately Played">Moderately Played</option>
                        <option value="Heavily Played">Heavily Played</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="edit-stock">Stock Quantity</Label>
                      <Input
                        id="edit-stock"
                        type="number"
                        min="0"
                        value={editingCard.stock_quantity}
                        onChange={(e) => setEditingCard({...editingCard, stock_quantity: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-image">Image URL</Label>
                      <Input
                        id="edit-image"
                        type="url"
                        value={editingCard.image_url || ''}
                        onChange={(e) => setEditingCard({...editingCard, image_url: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editingCard.description || ''}
                        onChange={(e) => setEditingCard({...editingCard, description: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">Update Product</Button>
                      <Button type="button" variant="outline" onClick={() => setEditingCard(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
              {cards.map((card) => (
                <Card key={card.id} className={`${!card.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCard({
                            id: card.id,
                            name: card.name,
                            description: card.description,
                            price_eth: card.price_eth,
                            image_url: card.image_url,
                            rarity: card.rarity,
                            product_type: card.product_type || 'Card',
                            grading_company: card.grading_company,
                            grade: card.grade,
                            set_name: card.set_name,
                            condition: card.condition,
                            stock_quantity: card.stock_quantity
                          })}
                          title="Edit Card"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCardActive(card)}
                          title={card.is_active ? "Hide Card" : "Show Card"}
                        >
                          {card.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCard(card.id, card.name)}
                          title="Delete Card Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {card.product_type && (
                        <Badge variant="default">{card.product_type}</Badge>
                      )}
                      {card.rarity && (
                        <Badge variant="secondary">{card.rarity}</Badge>
                      )}
                      <Badge variant={card.is_active ? "default" : "destructive"}>
                        {card.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Price:</span> {card.price_eth} ETH</p>
                      <p><span className="font-medium">Stock:</span> {card.stock_quantity}</p>
                      {card.grading_company && (
                        <p><span className="font-medium">Grading:</span> {card.grading_company} {card.grade}</p>
                      )}
                      {card.set_name && <p><span className="font-medium">Set:</span> {card.set_name}</p>}
                      {card.condition && <p><span className="font-medium">Condition:</span> {card.condition}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Order Management</h2>
            
            {/* Order Status Tabs */}
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
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Customer: {order.user?.username || 'Unknown'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{order.total_price_eth} ETH</p>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="mt-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {order.card && (
                            <p><span className="font-medium">Card:</span> {order.card.name}</p>
                          )}
                          <p><span className="font-medium">Quantity:</span> {order.quantity}</p>
                          {order.transaction_hash && (
                            <p>
                              <span className="font-medium">TX Hash:</span> 
                              <a 
                                href={`https://etherscan.io/tx/${order.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-mono text-xs underline ml-1"
                              >
                                {order.transaction_hash.slice(0, 10)}...{order.transaction_hash.slice(-8)}
                              </a>
                              <span className="text-gray-400 ml-1 text-xs">↗</span>
                            </p>
                          )}
                        </div>
                        
                        {order.customer_info && (
                          <div className="text-xs bg-blue-50 p-3 rounded border border-blue-200 mt-3">
                            <p className="font-semibold text-gray-700 mb-1">📦 Shipping Information:</p>
                            <p className="text-gray-600">{order.customer_info.name}</p>
                            <p className="text-gray-600">{order.customer_info.email}</p>
                            <p className="text-gray-600">{order.customer_info.address}</p>
                            <p className="text-gray-600">{order.customer_info.city}, {order.customer_info.state} {order.customer_info.zipCode}</p>
                            <p className="text-gray-600">{order.customer_info.country}</p>
                            {order.customer_info.phone && (
                              <p className="text-gray-600 mt-1">📞 {order.customer_info.phone}</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Customer: {order.user?.username || 'Unknown'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{order.total_price_eth} ETH</p>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="mt-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {order.card && (
                            <p><span className="font-medium">Card:</span> {order.card.name}</p>
                          )}
                          <p><span className="font-medium">Quantity:</span> {order.quantity}</p>
                          {order.transaction_hash && (
                            <p>
                              <span className="font-medium">TX Hash:</span> 
                              <a 
                                href={`https://etherscan.io/tx/${order.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-mono text-xs underline ml-1"
                              >
                                {order.transaction_hash.slice(0, 10)}...{order.transaction_hash.slice(-8)}
                              </a>
                              <span className="text-gray-400 ml-1 text-xs">↗</span>
                            </p>
                          )}
                        </div>
                        
                        {order.customer_info && (
                          <div className="text-xs bg-blue-50 p-3 rounded border border-blue-200 mt-3">
                            <p className="font-semibold text-gray-700 mb-1">📦 Shipping Information:</p>
                            <p className="text-gray-600">{order.customer_info.name}</p>
                            <p className="text-gray-600">{order.customer_info.email}</p>
                            <p className="text-gray-600">{order.customer_info.address}</p>
                            <p className="text-gray-600">{order.customer_info.city}, {order.customer_info.state} {order.customer_info.zipCode}</p>
                            <p className="text-gray-600">{order.customer_info.country}</p>
                            {order.customer_info.phone && (
                              <p className="text-gray-600 mt-1">📞 {order.customer_info.phone}</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Settings</CardTitle>
              <CardDescription>
                Configure your marketplace preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Admin Wallet Addresses</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Customer payments will be sent to these addresses
                  </p>
                  
                  {/* List of wallet addresses */}
                  <div className="space-y-2 mb-3">
                    {adminWallets.map((wallet, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          value={wallet}
                          onChange={(e) => {
                            const newWallets = [...adminWallets];
                            newWallets[index] = e.target.value;
                            setAdminWallets(newWallets);
                          }}
                          className="font-mono text-sm flex-1"
                          placeholder="0x..."
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (adminWallets.length > 1) {
                              setAdminWallets(adminWallets.filter((_, i) => i !== index));
                            } else {
                              alert('You must have at least one admin wallet address');
                            }
                          }}
                          disabled={adminWallets.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add new wallet */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                      placeholder="Add new wallet address (0x...)"
                      className="font-mono text-sm flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (newWallet.trim() && newWallet.startsWith('0x')) {
                          setAdminWallets([...adminWallets, newWallet.trim()]);
                          setNewWallet('');
                        } else {
                          alert('Please enter a valid Ethereum wallet address starting with 0x');
                        }
                      }}
                      disabled={!newWallet.trim()}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Changes are stored in browser state. For production, implement backend storage.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPanel