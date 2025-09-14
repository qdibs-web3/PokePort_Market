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
    image_urls: [''], // Add this for multiple images
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
    const activeCards = cardsData.filter(card => card.is_active === true).length // Explicit boolean check
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

    console.log('Analytics Debug:', { // Add debug logging
      totalCards,
      activeCards,
      cardsData: cardsData.map(c => ({ name: c.name, is_active: c.is_active }))
    })

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
          set_name: editingCard.set_name,
          condition: editingCard.condition,
          stock_quantity: parseInt(editingCard.stock_quantity)
        }),
      })

      if (response.ok) {
        setEditingCard(null)
        loadAdminData()
        onCardUpdate()
        alert('Card updated successfully!')
      } else {
        const errorData = await response.json()
        alert('Failed to update card: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating card:', error)
      alert('Error updating card: ' + error.message)
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
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Pokemon Card</DialogTitle>
                    <DialogDescription>
                      Add a new card to your marketplace inventory
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCard} className="space-y-4">
                    {/* Add Card Form - keep existing form fields */}
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

                    {/* Replace the single image URL input with multiple image inputs */}
                    <div>
                      <Label htmlFor="image_urls">Image URLs</Label>
                      <div className="space-y-2">
                        {(newCard.image_urls || []).map((url, index) => (
                          <div key={index} className="flex space-x-2">
                            <Input
                              type="url"
                              value={url}
                              onChange={(e) => {
                                const newUrls = [...(newCard.image_urls || [])];
                                newUrls[index] = e.target.value;
                                setNewCard({...newCard, image_urls: newUrls});
                              }}
                              placeholder={`Image URL ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newUrls = (newCard.image_urls || []).filter((_, i) => i !== index);
                                setNewCard({...newCard, image_urls: newUrls});
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newUrls = [...(newCard.image_urls || []), ''];
                            setNewCard({...newCard, image_urls: newUrls});
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Image URL
                        </Button>
                      </div>
                    </div>

                    {/* Keep the single image URL for backward compatibility */}
                    <div>
                      <Label htmlFor="image_url">Primary Image URL (Legacy)</Label>
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

            {/* Edit Card Dialog */}
            <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Pokemon Card</DialogTitle>
                  <DialogDescription>
                    Update card information
                  </DialogDescription>
                </DialogHeader>
                {editingCard && (
                  <form onSubmit={(e) => handleEditCard(e)} className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Card Name</Label>
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
                      <Button type="submit" className="flex-1">Update Card</Button>
                      <Button type="button" variant="outline" onClick={() => setEditingCard(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>

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
                          onClick={() => setEditingCard({
                            id: card.id,
                            name: card.name,
                            description: card.description,
                            price_eth: card.price_eth,
                            image_url: card.image_url,
                            rarity: card.rarity,
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

