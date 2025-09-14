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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black-400 w-5 h-5" />
            <Input
              placeholder="Search Pokemon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
            <Card key={card.id} className="overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-500
             bg-gradient-to-br from-black/2 to-black/2 backdrop-blur-md
             border border-gray-300 rounded-2xl w-70 mx-auto flex flex-col p-0">
              {/* Compact Image Section */}
              <CardHeader className="relative p-0 m-0">
                <div className="relative w-full h-64 overflow-hidden rounded-t-2xl">
                  <img
                    src={card.image_urls?.[currentImageIndex[card.id] || 0] || card.image_url}
                    alt={card.name}
                    className="w-full h-full object-cover block"
                  />
                </div>

                {/* Condition Badge */}
                {card.condition && (
                  <Badge
                    className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full shadow-lg
                      ${card.condition.toLowerCase() === 'mint' ? 'bg-green-500 text-white' :
                        card.condition.toLowerCase() === 'near mint' ? 'bg-blue-500 text-white' :
                        card.condition.toLowerCase() === 'lightly played' ? 'bg-purple-500 text-white' :
                        card.condition.toLowerCase() === 'moderately played' ? 'bg-yellow-500 text-black' :
                        card.condition.toLowerCase() === 'heavily played' ? 'bg-red-500 text-white' :
                        'bg-gray-400 text-white'}`}
                  >
                    {card.condition}
                  </Badge>
                )}
              </CardHeader>


              <CardContent className="-mt-5 pb-2 px-3 space-y-1">
                <CardTitle className="text-m font-bold text-gray-900 line-clamp-1 mt-1">
                  {card.name}
                </CardTitle>

                <span className="text-l font-bold text-blue-600">
                  {card.price_eth} ETH
                </span>

                <div className="grid grid-cols-1 gap-1 text-sm text-gray-600">
                  {card.set_name && (
                    <div>
                      <span className="font-medium">Set:</span> {card.set_name}
                    </div>
                  )}
                  {card.condition && (
                    <div>
                      <span className="font-medium">Condition:</span> {card.condition}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Stock:</span> {card.stock_quantity}
                  </div>
                  {card.card_number && (
                    <div>
                      <span className="font-medium">#</span>{card.card_number}
                    </div>
                  )}
                </div>
              </CardContent>

 
              {/* Compact Footer */}
              <CardFooter className="p-2 pt-0">
                <Button 
                  onClick={() => handlePurchase(card)}
                  disabled={!user || purchasing === card.id || card.stock_quantity === 0}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 
                            hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 
                            text-white font-semibold py-2 h-10 rounded-xl shadow-lg 
                            transition-all duration-300 flex items-center justify-center gap-1"
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

