// src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, ShoppingBag, User, Shield, ChevronLeft, ChevronRight, Sun, Moon, Slack, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import plogo from '/src/assets/plogo.png'
import pblogo from '/src/assets/pb.png'
import { useTheme } from '../contexts/ThemeContext'

const Sidebar = ({ user, isCollapsed, onToggleCollapse }) => {
  const location = useLocation()
  const { isDarkMode, toggleTheme } = useTheme()

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, requiresAuth: false, adminOnly: false },
    { path: '/explore', label: 'Explore', icon: Compass, requiresAuth: false, adminOnly: false },
    { path: '/market', label: 'Market', icon: ShoppingBag, requiresAuth: false, adminOnly: false },
    { path: '/daily-catch', label: '151 Pokedex', icon: Zap, requiresAuth: false, adminOnly: false }, // NEW
    { path: '/battle-arena', label: 'Battle Arena', icon: Slack, requiresAuth: false, adminOnly: false },
    { path: '/account', label: 'My Account', icon: User, requiresAuth: true, adminOnly: false },
    { path: '/admin', label: 'Admin Panel', icon: Shield, requiresAuth: true, adminOnly: true }
  ]

  const visibleNavItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false
    if (item.adminOnly && (!user || !user.is_admin)) return false
    return true
  })

  return (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ${
        isCollapsed ? 'w-[60px]' : 'w-[20%] min-w-[240px] max-w-[280px]'
      }`}
    >
      <div className="p-4 border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <Link to="/" className="flex items-center justify-center">
          <img
            src={isCollapsed ? pblogo : plogo}
            alt="PokéPort Logo"
            className={`object-contain cursor-pointer hover:opacity-90 transition-opacity duration-200 ${
              isCollapsed ? 'w-8 h-8' : 'w-60 h-14'
            }`}
          />
        </Link>
      </div>

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
                  <span className="text-sm whitespace-nowrap pokemon-font">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-gray-200 dark:border-gray-700 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={`w-full flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-start'} hover:bg-gray-100 dark:hover:bg-gray-800`}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={`w-full flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'justify-start'} hover:bg-gray-100 dark:hover:bg-gray-800`}
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