import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingCart,
  Package,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState(null)

  const dropdownRef = useRef(null)
  const { addToCart } = useCart()

  // Click outside -> close filters
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsFiltersOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [fullscreenImage])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (fullscreenImage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [fullscreenImage])

  // Filter logic
  const filteredCards = cards.filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRarity = !selectedRarity || card.rarity === selectedRarity
    const matchesProductType = !selectedProductType || card.product_type === selectedProductType

    const cardPrice = parseFloat(card.price_eth)
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity
    const matchesPrice = cardPrice >= minPrice && cardPrice <= maxPrice

    return (
      matchesSearch &&
      matchesRarity &&
      matchesProductType &&
      matchesPrice &&
      card.is_active &&
      card.stock_quantity > 0
    )
  })

  const productTypes = ['Card', 'Graded Card', 'Sealed', 'Custom']

  const handleAddToCart = (card) => {
    if (!user) {
      alert('Please connect your wallet to add cards to cart!')
      return
    }
    addToCart(card)
    setToastCard(card)
    setShowToast(true)
  }

  const handleImageClick = (imageUrl, cardName) => {
    setFullscreenImage({ url: imageUrl, name: cardName })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedRarity('')
    setSelectedProductType('')
    setPriceRange({ min: '', max: '' })
    // keep panel open so user can reapply if desired; comment out next line if you want it to close
    // setIsFiltersOpen(false)
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
      {/* Toast */}
      <Toast show={showToast} onClose={() => setShowToast(false)} card={toastCard} />

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close fullscreen image"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-7xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.name}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              {fullscreenImage.name && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                  <p className="text-white text-center font-semibold">{fullscreenImage.name}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Header + Animated Dropdown Panel */}
      <div className="mb-6 relative" ref={dropdownRef}>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Header Button */}
          <button
            onClick={() => setIsFiltersOpen((s) => !s)}
            className="flex items-center justify-between w-full px-4 py-3 border-b border-gray-200 bg-gray-50 cursor-pointer"
            aria-expanded={isFiltersOpen}
            aria-controls="filter-panel"
            type="button"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
            </div>
            <div className="flex items-center gap-2">
              {(selectedProductType || selectedRarity || priceRange.min || priceRange.max || searchTerm) && (
                <span className="text-xs text-gray-500 italic">Active</span>
              )}
              {isFiltersOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </button>

          {/* Animated Panel */}
          <AnimatePresence initial={false}>
            {isFiltersOpen && (
              <motion.div
                id="filter-panel"
                key="filter-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-gray-100 bg-white"
              >
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2 lg:col-span-2">
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search Product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsFiltersOpen(false)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Product Type</label>
                    <select
                      value={selectedProductType}
                      onChange={(e) => {
                        setSelectedProductType(e.target.value)
                        setIsFiltersOpen(false)
                      }}
                      className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      {productTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Price Range (ETH)</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="text-sm h-9"
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedProductType || selectedRarity || priceRange.min || priceRange.max || searchTerm) && (
                  <div className="px-4 pb-3 flex flex-wrap gap-2 items-center border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-600 font-medium">Active:</span>

                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        Search: {searchTerm}
                        <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-600">×</button>
                      </Badge>
                    )}
                    {selectedProductType && (
                      <Badge variant="secondary" className="text-xs">
                        Type: {selectedProductType}
                        <button onClick={() => setSelectedProductType('')} className="ml-1 hover:text-red-600">×</button>
                      </Badge>
                    )}
                    {selectedRarity && (
                      <Badge variant="secondary" className="text-xs">
                        Rarity: {selectedRarity}
                        <button onClick={() => setSelectedRarity('')} className="ml-1 hover:text-red-600">×</button>
                      </Badge>
                    )}
                    {(priceRange.min || priceRange.max) && (
                      <Badge variant="secondary" className="text-xs">
                        Price: {priceRange.min || '0'} - {priceRange.max || '∞'} ETH
                        <button onClick={() => setPriceRange({ min: '', max: '' })} className="ml-1 hover:text-red-600">×</button>
                      </Badge>
                    )}
                  </div>
                )}

                <div className="px-4 pb-3 border-t border-gray-100 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearFilters()
                      setIsFiltersOpen(false)
                    }}
                    className="text-xs h-7"
                  >
                    <X className="w-3 h-3 mr-1" /> Clear All
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 transition-all duration-300">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-500
               bg-gradient-to-br from-black/2 to-black/2 backdrop-blur-md
               border border-gray-300 rounded-2xl w-full flex flex-col p-0"
            >
              <CardHeader className="relative p-0 m-0">
                <div 
                  className="relative w-full h-48 sm:h-64 overflow-hidden rounded-t-2xl cursor-pointer"
                  onClick={() => handleImageClick(
                    card.image_urls?.[currentImageIndex[card.id] || 0] || card.image_url,
                    card.name
                  )}
                >
                  <img
                    src={card.image_urls?.[currentImageIndex[card.id] || 0] || card.image_url}
                    alt={card.name}
                    className="w-full h-full object-cover block hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {card.product_type && (
                  <Badge className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full shadow-lg bg-indigo-500 text-white">
                    {card.product_type}
                  </Badge>
                )}

                {card.condition && (
                  <Badge
                    className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full shadow-lg
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

              <CardContent className="-mt-5 pb-2 px-2 sm:px-3 space-y-1">
                <CardTitle className="text-sm sm:text-m font-bold text-gray-900 line-clamp-1 mt-1">
                  {card.name}
                </CardTitle>

                <span className="text-base sm:text-l font-bold text-blue-600">{card.price_eth} ETH</span>

                <div className="grid grid-cols-1 gap-1 text-xs sm:text-sm text-gray-600">
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
                      <span className="font-medium">#</span>
                      {card.card_number}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-2 pt-0">
                <Button
                  onClick={() => handleAddToCart(card)}
                  disabled={!user || card.stock_quantity === 0}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 
                            hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 
                            text-white font-semibold py-2 h-8 sm:h-10 rounded-xl shadow-lg 
                            transition-all duration-300 flex items-center justify-center gap-1 text-xs sm:text-sm"
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  {!user ? 'Connect Wallet' : card.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
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