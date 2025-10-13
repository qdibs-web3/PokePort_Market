import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Search, ShoppingCart, Star, Package, Filter, X } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import Toast from './Toast'

const CardGrid = ({ cards, loading, user, onCardPurchase }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRarity, setSelectedRarity] = useState('')
  const [selectedProductType, setSelectedProductType] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [currentImageIndex, setCurrentImageIndex] = useState({})
  const [showToast, setShowToast] = useState(false)
  const [toastCard, setToastCard] = useState(null)
  const { addToCart } = useCart()

  // Filter cards based on search, rarity, product type, and price
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRarity = !selectedRarity || card.rarity === selectedRarity
    const matchesProductType = !selectedProductType || card.product_type === selectedProductType
    
    // Price filtering
    const cardPrice = parseFloat(card.price_eth)
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity
    const matchesPrice = cardPrice >= minPrice && cardPrice <= maxPrice
    
    return matchesSearch && matchesRarity && matchesProductType && matchesPrice && card.is_active && card.stock_quantity > 0
  })

  // Get unique rarities and product types for filters
  const rarities = [...new Set(cards.map(card => card.rarity).filter(Boolean))]
  const productTypes = ['Card', 'Graded Card', 'Sealed', 'Custom']

  // Handle adding card to cart
  const handleAddToCart = (card) => {
    if (!user) {
      alert('Please connect your wallet to add cards to cart!')
      return
    }

    addToCart(card)
    setToastCard(card)
    setShowToast(true)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedRarity('')
    setSelectedProductType('')
    setPriceRange({ min: '', max: '' })
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
      {/* Toast Notification */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        card={toastCard}
      />

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search Pokemon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>

          {/* Product Type Filter Buttons */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Product Type</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedProductType === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProductType('')}
                className="text-xs"
              >
                All
              </Button>
              {productTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedProductType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedProductType(type)}
                  className="text-xs"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Rarity Filter */}
          {rarities.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Rarity</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedRarity === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRarity('')}
                  className="text-xs"
                >
                  All
                </Button>
                {rarities.map((rarity) => (
                  <Button
                    key={rarity}
                    variant={selectedRarity === rarity ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRarity(rarity)}
                    className="text-xs"
                  >
                    {rarity}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range Filter */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Price Range (ETH)</label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                step="0.001"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="text-sm"
              />
              <span className="text-gray-400">-</span>
              <Input
                type="number"
                step="0.001"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedProductType || selectedRarity || priceRange.min || priceRange.max) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-600">Active filters:</span>
            {selectedProductType && (
              <Badge variant="secondary" className="text-xs">
                Type: {selectedProductType}
                <button 
                  onClick={() => setSelectedProductType('')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedRarity && (
              <Badge variant="secondary" className="text-xs">
                Rarity: {selectedRarity}
                <button 
                  onClick={() => setSelectedRarity('')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {(priceRange.min || priceRange.max) && (
              <Badge variant="secondary" className="text-xs">
                Price: {priceRange.min || '0'} - {priceRange.max || '∞'} ETH
                <button 
                  onClick={() => setPriceRange({ min: '', max: '' })}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
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

                {/* Product Type Badge */}
                {card.product_type && (
                  <Badge
                    className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full shadow-lg bg-indigo-500 text-white"
                  >
                    {card.product_type}
                  </Badge>
                )}

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
                  {card.product_type === 'Graded Card' && card.grading_company && (
                    <div>
                      <span className="font-medium">Grade:</span> {card.grading_company} {card.grade}
                    </div>
                  )}
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
                  onClick={() => handleAddToCart(card)}
                  disabled={!user || card.stock_quantity === 0}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 
                            hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 
                            text-white font-semibold py-2 h-10 rounded-xl shadow-lg 
                            transition-all duration-300 flex items-center justify-center gap-1"
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  {!user ? 'Connect Wallet' : 
                  card.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
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