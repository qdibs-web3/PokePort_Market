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
  EyeOff
} from 'lucide-react'

const AdminPanel = ({ user, onCardUpdate }) => {
  const [cards, setCards] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [newCard, setNewCard] = useState({
    name: '',
    description: '',
    price_eth: '',
    image_url: '',
    rarity: '',
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
      // Load all cards (including inactive)
      const cardsResponse = await fetch('/api/cards')
      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json()
        setCards(cardsData.cards || [])
      }

      // Load all orders
      const ordersResponse = await fetch('/api/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
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
    const activeCards = cardsData.filter(card => card.is_active).length
    const totalOrders = ordersData.length
    const confirmedOrders = ordersData.filter(order => order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered')
    const totalRevenue = confirmedOrders.reduce((sum, order) => sum + order.total_price_eth, 0)
    const pendingOrders = ordersData.filter(order => order.status === 'pending').length

    setAnalytics({
      totalCards,
      activeCards,
      totalOrders,
      confirmedOrders: confirmedOrders.length,
      totalRevenue: totalRevenue.toFixed(4),
      pendingOrders
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
          rarity: '',
          set_name: '',
          card_number: '',
          condition: '',
          stock_quantity: 1
        })
        loadAdminData()
        onCardUpdate()
      }
    } catch (error) {
      console.error('Error adding card:', error)
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

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        loadAdminData()
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const toggleCardActive = (card) => {
    handleUpdateCard(card.id, { is_active: !card.is_active })
  }

  if (!user || !user.is_admin) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
          </div>
        </TabsContent>

        <TabsContent value="cards">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Card Management</h2>
              <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Card
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Pokemon Card</DialogTitle>
                    <DialogDescription>
                      Add a new card to your marketplace inventory
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCard} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Card Name</Label>
                      <Input
                        id="name"
                        value={newCard.name}
                        onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (ETH)</Label>
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
                      <Label htmlFor="stock">Stock Quantity</Label>
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
                    <Button type="submit" className="w-full">Add Card</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <Card key={card.id} className={`${!card.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCardActive(card)}
                        >
                          {card.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex space-x-2">
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
            
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Order #{order.id}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Customer: {order.user?.username}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.total_price_eth} ETH</p>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="mt-2 px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    
                    {order.card && (
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
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
                        <div>
                          <h4 className="font-medium">{order.card.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.transaction_hash && (
                      <div className="mt-4 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                        TX: {order.transaction_hash}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  <Label>Admin Wallet Address</Label>
                  <Input 
                    value="0xf08d3184c50a1B255507785F71c9330034852Cd5" 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is where customer payments will be sent
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

