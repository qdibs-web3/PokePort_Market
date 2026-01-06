import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Wallet, Search, ShoppingCart, User, Settings } from 'lucide-react'
import plogo from '/src/assets/pmarket.png'
import expika from '/src/assets/expika.png'
import './App.css'

// Components
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import CardGrid from './components/CardGrid'
import UserAccount from './components/UserAccount'
import AdminPanel from './components/AdminPanel'
import Dashboard from './components/pages/Dashboard'
import Explore from './components/pages/Explore'
import BattleArena from './components/pages/BattleArena'
import DailyCatch from './components/pages/DailyCatch'
import Pokedex from './components/pages/Pokedex'
import Token from './components/pages/Token' // NEW
import { CartProvider } from './contexts/CartContext'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [user, setUser] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      setIsConnecting(true)
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const walletAddress = accounts[0]
        
        // Authenticate with backend
        const response = await fetch('/api/users/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: walletAddress }),
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          localStorage.setItem('walletAddress', walletAddress)
        }
      } catch (error) {
        console.error('Error connecting wallet:', error)
      } finally {
        setIsConnecting(false)
      }
    } else {
      alert('Please install MetaMask to use this marketplace!')
    }
  }

  const disconnectWallet = () => {
    setUser(null)
    localStorage.removeItem('walletAddress')
  }

  // Load cards
  const loadCards = async () => {
    try {
      const response = await fetch('/api/cards')
      if (response.ok) {
        const data = await response.json()
        setCards(data.cards || [])
      }
    } catch (error) {
      console.error('Error loading cards:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-connect wallet and load cards
  useEffect(() => {
    const savedWallet = localStorage.getItem('walletAddress')
    if (savedWallet && typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0 && accounts[0] === savedWallet) {
          connectWallet()
        }
      })
    }
    loadCards()
  }, [])

  return (
    <ThemeProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            
            {/* Sidebar */}
            <Sidebar 
              user={user} 
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            
            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-screen">
              <Header 
                user={user} 
                onConnectWallet={connectWallet} 
                onDisconnectWallet={disconnectWallet}
                isConnecting={isConnecting}
              />
              
              <main className="flex-1 container mx-auto px-4 py-8" style={{ paddingBottom: '120px' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  
                  {/* ✅ NEW: Token Route */}
                  <Route path="/token" element={<Token />} />
                  
                  <Route
                    path="/explore"
                    element={
                      <div>
                        <div className="text-center mb-8">
                          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex justify-center">
                            <img
                              src={expika}
                              alt="Pokemon Market Logo"
                              className="h-35 w-auto object-contain"
                            />
                          </h1>
                          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Select a Pokémon series, a set, and enjoy viewing and learning the cards!
                            Japanese is under construction, enjoy the little that is avalible.
                          </p>
                        </div>
                        <Explore />
                      </div>
                    }
                  />

                  {/* <Route 
                    path="/market" 
                    element={
                      <div>
                        <div className="text-center mb-8">
                          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex justify-center">
                            <img
                              src={plogo}
                              alt="Pokemon Market Logo"
                              className="h-35 w-auto object-contain"
                            />
                          </h1>
                          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Discover and collect authentic Pokémon cards and unique pieces via crypto.
                          </p>
                        </div>
                        <CardGrid 
                          cards={cards} 
                          loading={loading} 
                          user={user}
                          onCardPurchase={loadCards}
                        />
                      </div>
                    } 
                  /> */}

                  <Route path="/account" element={<UserAccount user={user} onCardPurchase={loadCards} />} />
                  <Route path="/admin" element={<AdminPanel user={user} onCardUpdate={loadCards} />} />

                  {/* Battle Arena Route */}
                  <Route path="/battle-arena" element={<BattleArena />} />

                  {/* Daily Catch Route */}
                  <Route path="/daily-catch" element={<DailyCatch user={user} />} />

                  {/* Pokedex Route */}
                  <Route path="/pokedex" element={<Pokedex user={user} />} />

                </Routes>
              </main>
            </div>
            
            {/* Footer - positioned to align with main content, not covering sidebar */}
            <Footer sidebarCollapsed={sidebarCollapsed} />
          </div>
        </Router>
      </CartProvider>
    </ThemeProvider>
  )
}

export default App