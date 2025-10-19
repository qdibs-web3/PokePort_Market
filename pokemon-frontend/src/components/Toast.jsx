import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, X, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

const Toast = ({ show, onClose, card }) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 8000) // Auto-dismiss after 4 seconds

      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  const handleViewCart = () => {
    onClose()
    navigate('/account', { state: { activeTab: 'cart' } })
  }

  if (!show || !card) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[375px] max-w-md">
        <div className="flex items-start gap-3">
          {/* Success Icon */}
          <div className="flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Added to cart!
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Info */}
            <div className="flex gap-3 mb-3">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {card.name}
                </p>
                {card.product_type && (
                  <p className="text-xs text-gray-500">
                    {card.product_type}
                  </p>
                )}
                <p className="text-sm font-semibold text-blue-600 mt-1">
                  {card.price_eth} ETH
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleViewCart}
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                View Cart
              </Button>
              <Button
                onClick={onClose}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Toast