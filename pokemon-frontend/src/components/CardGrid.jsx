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
  const [currentImageIndex, setCurrentImageIndex] = useState({});


  // Filter cards based on search and rarity
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRarity = !selectedRarity || card.rarity === selectedRarity
    return matchesSearch && matchesRarity && card.is_active && card.stock_quantity > 0
  })

  // Get unique rarities for filter
  const rarities = [...new Set(cards.map(card => card.rarity).filter(Boolean))]

  // Replace the existing handlePurchase function (around line 25)
  const handlePurchase = async (card) => {
    if (!user) {
      alert('Please connect your wallet to purchase cards!')
      return
    }

    setPurchasing(card.id)
    try {
      // Create order with correct field names
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_id: card.id,  // This matches the backend expectation
          quantity: 1,
          buyer_wallet_address: user.wallet_address, // This matches the backend expectation
        }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const order = await orderResponse.json()

      // Request payment through MetaMask with proper admin wallet
      const adminWallet = process.env.REACT_APP_ADMIN_WALLET || '0xf08d3184c50a1B255507785F71c9330034852Cd5'
      
      const transactionParameters = {
        to: adminWallet,
        from: user.wallet_address,
        value: '0x' + (card.price_eth * Math.pow(10, 18)).toString(16), // Convert ETH to Wei in hex
        gas: '0x5208', // 21000 in hex
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
      case 'common': 
        return 'bg-gray-500 text-white border-gray-600'
      case 'uncommon': 
        return 'bg-green-500 text-white border-green-600'
      case 'rare': 
        return 'bg-blue-500 text-white border-blue-600'
      case 'ultra rare': 
        return 'bg-purple-500 text-white border-purple-600'
      case 'legendary': 
        return 'bg-yellow-500 text-black border-yellow-600'
      default: 
        return 'bg-gray-400 text-white border-gray-500'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredCards.map((card) => (
            <Card key={card.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border border-gray-200 hover:border-blue-300 max-w-xs mx-auto">
              {/* Compact Image Section */}
              <CardHeader className="p-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
                  {card.image_urls && card.image_urls.length > 0 ? (
                    <>
                      <img 
                        src={card.image_urls[currentImageIndex[card.id] || 0]} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                      {card.image_urls.length > 1 && (
                        <>
                          {/* Compact Navigation Buttons */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute left-1 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 bg-white/90 hover:bg-white border-0 shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = currentImageIndex[card.id] || 0;
                              const newIndex = currentIndex > 0 ? currentIndex - 1 : card.image_urls.length - 1;
                              setCurrentImageIndex(prev => ({...prev, [card.id]: newIndex}));
                            }}
                          >
                            <span className="text-xs font-bold">‹</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 bg-white/90 hover:bg-white border-0 shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = currentImageIndex[card.id] || 0;
                              const newIndex = currentIndex < card.image_urls.length - 1 ? currentIndex + 1 : 0;
                              setCurrentImageIndex(prev => ({...prev, [card.id]: newIndex}));
                            }}
                          >
                            <span className="text-xs font-bold">›</span>
                          </Button>
                          
                          {/* Compact Image Indicators */}
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            {card.image_urls.map((_, index) => (
                              <div
                                key={index}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  index === (currentImageIndex[card.id] || 0) 
                                    ? 'bg-white shadow-md' 
                                    : 'bg-white/60'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : card.image_url ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3">
                      <Star className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">No image</p>
                    </div>
                  )}
                  
                  {/* Rarity Badge Overlay */}
                  {card.rarity && (
                    <Badge className={`absolute top-2 right-2 text-xs px-2 py-1 ${getRarityColor(card.rarity)} shadow-md`}>
                      {card.rarity}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              {/* Compact Content Section */}
              <CardContent className="p-3 space-y-2">
                {/* Title and Price Row */}
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-bold text-gray-900 line-clamp-1 flex-1">
                    {card.name}
                  </CardTitle>
                  <span className="text-lg font-bold text-blue-600 whitespace-nowrap">
                    {card.price_eth} ETH
                  </span>
                </div>
                
                {/* Compact Info Grid */}
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                  {card.set_name && (
                    <div className="truncate">
                      <span className="font-medium">Set:</span> {card.set_name}
                    </div>
                  )}
                  {card.condition && (
                    <div className="truncate">
                      <span className="font-medium">Condition:</span> {card.condition}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Stock:</span> {card.stock_quantity}
                  </div>
                  {card.card_number && (
                    <div className="truncate">
                      <span className="font-medium">#</span>{card.card_number}
                    </div>
                  )}
                </div>
                
                {/* Description - Only if exists and space allows */}
                {card.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                    {card.description}
                  </p>
                )}
              </CardContent>
              
              {/* Compact Footer */}
              <CardFooter className="p-3 pt-0">
                <Button 
                  onClick={() => handlePurchase(card)}
                  disabled={!user || purchasing === card.id || card.stock_quantity === 0}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm py-2 h-8 transition-all duration-200"
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  {purchasing === card.id ? 'Processing...' : 
                  !user ? 'Connect Wallet' : 
                  card.stock_quantity === 0 ? 'Out of Stock' : 'Buy Now'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

      )}
    </div>
  )
}

export default CardGrid

