import { Link, useLocation } from 'react-router-dom'
import { Compass, ShoppingBag, User, Shield, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import plogo from '/src/assets/plogo.png'
import { useTheme } from '../contexts/ThemeContext'

const Sidebar = ({ user, isCollapsed, onToggleCollapse }) => {
  const location = useLocation()
  const { isDarkMode, toggleTheme } = useTheme()

  // Helper function to check if a route is active
  const isActive = (path) => location.pathname === path

  // Navigation items configuration
  const navItems = [
    {
      path: '/',
      label: 'Explore',
      icon: Compass,
      requiresAuth: false,
      adminOnly: false
    },
    {
      path: '/market',
      label: 'Market',
      icon: ShoppingBag,
      requiresAuth: false,
      adminOnly: false
    },
    {
      path: '/account',
      label: 'My Account',
      icon: User,
      requiresAuth: true,
      adminOnly: false
    },
    {
      path: '/admin',
      label: 'Admin Panel',
      icon: Shield,
      requiresAuth: true,
      adminOnly: true
    }
  ]

  // Filter navigation items based on user state
  const visibleNavItems = navItems.filter(item => {
    // If item requires auth and user is not logged in, hide it
    if (item.requiresAuth && !user) return false
    // If item is admin-only and user is not admin, hide it
    if (item.adminOnly && (!user || !user.is_admin)) return false
    return true
  })

  return (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ${
        isCollapsed ? 'w-[60px]' : 'w-[20%] min-w-[240px] max-w-[280px]'
      }`}
    >
      {/* Logo Section */}
      <div className="p-4 border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <Link to="/" className="flex items-center justify-center">
          <img
            src={plogo}
            alt="PokéPort Logo"
            className={`object-contain cursor-pointer hover:opacity-90 transition-opacity duration-200 ${
              isCollapsed ? 'w-8 h-8' : 'w-60 h-14'
            }`}
          />
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-2 space-y-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
              {!isCollapsed && (
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Controls: Dark Mode Toggle + Collapse Button */}
      <div className="p-4 border-gray-200 dark:border-gray-700 space-y-2">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={`w-full flex items-center gap-2 ${
            isCollapsed ? 'justify-center' : 'justify-start'
          } hover:bg-gray-100 dark:hover:bg-gray-800`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-5 h-5 text-yellow-500" />
              {!isCollapsed && <span className="text-sm">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {!isCollapsed && <span className="text-sm">Dark Mode</span>}
            </>
          )}
        </Button>

        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-2 ${
            isCollapsed ? 'justify-center' : 'justify-start'
          } hover:bg-gray-100 dark:hover:bg-gray-800`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar