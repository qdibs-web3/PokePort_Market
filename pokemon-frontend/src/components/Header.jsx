import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Wallet, User, ShoppingCart, Swords, Sun, Moon } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useTheme } from '../contexts/ThemeContext'
import plogo from '/src/assets/plogo.png'

const Header = ({ user, onConnectWallet, onDisconnectWallet, isConnecting }) => {
  const location = useLocation()
  const { getTotalItems } = useCart()
  const { isDarkMode, toggleTheme } = useTheme()
  const cartItemCount = getTotalItems()

  // Helper function to check if a route is active
  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Only visible on mobile, hidden on desktop (desktop has logo in sidebar) */}
          <Link to="/" className="flex items-center md:hidden">
            <img
              src={plogo}
              alt="PokéPort Logo"
              className="w-40 h-10 object-contain cursor-pointer hover:opacity-90 transition-opacity duration-200"
            />
          </Link>

          {/* Desktop welcome message */}
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {user
                ? `Welcome, ${user.display_name || user.username}!`
                : 'Welcome to PokéPort'}
            </h1>
          </div>

          {/* Wallet / Cart / Theme Toggle Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Dark Mode Toggle - Mobile Only */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </Button>

            {/* {user && (
              <Link to="/account" className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )} */}

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Connected
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnectWallet}
                  className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex flex-wrap gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <Link
            to="/"
            className={`text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
              isActive('/') ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            Dashboard
          </Link>

          {/* ✅ NEW: $Poke Link */}
          <Link
            to="/token"
            className={`text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
              isActive('/token') ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            $Poke
          </Link>

          <Link
            to="/explore"
            className={`text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
              isActive('/explore') ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            Explore
          </Link>

          {/* <Link
            to="/market"
            className={`text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
              isActive('/market') ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            Market
          </Link> */}

          <Link
            to="/daily-catch"
            className={`text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
              isActive('/daily-catch') ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            151 Pokedex
          </Link>

          <Link
            to="/badges"
            className={`text-sm flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
              isActive('/badges')
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : ''
            }`}
          >
            Badges
          </Link>

          {user && (
            <Link
              to="/account"
              className={`text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                isActive('/account')
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : ''
              }`}
            >
              My Account
            </Link>
          )}

          {user?.is_admin && (
            <Link
              to="/admin"
              className={`text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                isActive('/admin')
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : ''
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