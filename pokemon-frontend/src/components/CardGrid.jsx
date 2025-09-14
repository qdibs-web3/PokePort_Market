import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Search, ShoppingCart, Star, Package } from 'lucide-react'

const CardGrid = ({ cards, loading, user, onCardPurchase }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRarity, setSelectedRarity] = useState('')
  const [purchasing, setPurchasing] = useState(null)

  // Filter cards based on search and rarity
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRarity = !selectedRarity || card.rarity === selectedRarity
    return matchesSearch && matchesRarity && card.is_active && card.stock_quantity > 0
  })

  // Get unique rarities for filter
  const rarities = [...new Set(cards.map(card => card.rarity).filter(Boolean))]

  // Handle card purchase
  const handlePurchase = async (card) => {
    if (!user) {
      alert('Please connect your wallet to purchase cards!')
      return
    }

    setPurchasing(card.id)
    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_id: card.id,
          quantity: 1,
          buyer_wallet_address: user.wallet_address,
        }),
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const order = await orderResponse.json()

      // Request payment through MetaMask
      const transactionParameters = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A', // Admin wallet address (replace with actual)
        value: (card.price_eth * Math.pow(10, 18)).toString(16), // Convert ETH to Wei
        gas: '21000',
      }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      })

      // Confirm order with transaction hash
      await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_hash: txHash }),
      })

      alert('Purchase successful! Transaction hash: ' + txHash)
      onCardPurchase() // Refresh cards
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed: ' + error.message)
    } finally {
      setPurchasing(null)
    }
  }

  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'bg-gray-100 text-gray-800'
      case 'uncommon': return 'bg-green-100 text-green-800'
      case 'rare': return 'bg-blue-100 text-blue-800'
      case 'ultra rare': return 'bg-purple-100 text-purple-800'
      case 'legendary': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search Pokemon cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Rarities</option>
            {rarities.map(rarity => (
              <option key={rarity} value={rarity}>{rarity}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No cards found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map((card) => (
            <Card key={card.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-0">
                <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  {card.image_url ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Star className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No image</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">
                    {card.name}
                  </CardTitle>
                  {card.rarity && (
                    <Badge className={`text-xs ${getRarityColor(card.rarity)}`}>
                      {card.rarity}
                    </Badge>
                  )}
                </div>
                
                {card.description && (
                  <CardDescription className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {card.description}
                  </CardDescription>
                )}
                
                <div className="space-y-1 text-sm text-gray-600">
                  {card.set_name && <p><span className="font-medium">Set:</span> {card.set_name}</p>}
                  {card.condition && <p><span className="font-medium">Condition:</span> {card.condition}</p>}
                  <p><span className="font-medium">Stock:</span> {card.stock_quantity}</p>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">
                      {card.price_eth} ETH
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => handlePurchase(card)}
                    disabled={!user || purchasing === card.id || card.stock_quantity === 0}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {purchasing === card.id ? 'Processing...' : 
                     !user ? 'Connect Wallet' : 
                     card.stock_quantity === 0 ? 'Out of Stock' : 'Buy Now'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default CardGrid

