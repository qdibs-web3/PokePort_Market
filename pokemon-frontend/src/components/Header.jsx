import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Wallet, User, Settings, ShoppingCart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import plogo from '/src/assets/plogo.png';

const Header = ({ user, onConnectWallet, onDisconnectWallet, isConnecting }) => {
  const location = useLocation()
  const { getTotalItems } = useCart()
  const cartItemCount = getTotalItems()

  return (
    <header className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={plogo} 
              alt="PokéPort Logo"
              className="w-40 h-10 object-contain cursor-pointer hover:opacity-90 transition-opacity duration-200"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`text-gray-600 hover:text-gray-900 transition-colors ${
                location.pathname === '/' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Explore
            </Link>
            <Link 
              to="/market" 
              className={`text-gray-600 hover:text-gray-900 transition-colors ${
                location.pathname === '/' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Market
            </Link>
            {user && (
              <Link 
                to="/account" 
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  location.pathname === '/account' ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                My Account
              </Link>
            )}
            {user && user.is_admin && (
              <Link 
                to="/admin" 
                className={`text-gray-600 hover:text-gray-900 transition-colors ${
                  location.pathname === '/admin' ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {user && (
              <Link to="/account" className="relative">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onDisconnectWallet}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center space-x-4 border-t pt-4">
          <Link 
            to="/" 
            className={`text-sm text-gray-600 hover:text-gray-900 transition-colors ${
              location.pathname === '/' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Market
          </Link>
          {user && (
            <Link 
              to="/account" 
              className={`text-sm text-gray-600 hover:text-gray-900 transition-colors ${
                location.pathname === '/account' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              My Account
            </Link>
          )}
          {user && user.is_admin && (
            <Link 
              to="/admin" 
              className={`text-sm text-gray-600 hover:text-gray-900 transition-colors ${
                location.pathname === '/admin' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header