import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Wallet, Search, ShoppingCart, User, Settings } from 'lucide-react'
import './App.css'

// Components
import Header from './components/Header'
import CardGrid from './components/CardGrid'
import UserAccount from './components/UserAccount'
import AdminPanel from './components/AdminPanel'
import { CartProvider } from './contexts/CartContext'

function App() {
  const [user, setUser] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

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
          headers: {
            'Content-Type': 'application/json',
          },
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

  // Disconnect wallet
  const disconnectWallet = () => {
    setUser(null)
    localStorage.removeItem('walletAddress')
  }

  // Load cards from API
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

  // Check for existing wallet connection on load
  useEffect(() => {
    const savedWallet = localStorage.getItem('walletAddress')
    if (savedWallet && typeof window.ethereum !== 'undefined') {
      // Auto-connect if wallet was previously connected
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0 && accounts[0] === savedWallet) {
          connectWallet()
        }
      })
    }
    loadCards()
  }, [])

  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          <Header 
            user={user} 
            onConnectWallet={connectWallet} 
            onDisconnectWallet={disconnectWallet}
            isConnecting={isConnecting}
          />
          
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={
                <div>
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      Pokemon Market
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                      Discover and collect authentic Pokemon cards via crypto. 
                    </p>
                  </div>
                  
                  <CardGrid 
                    cards={cards} 
                    loading={loading} 
                    user={user}
                    onCardPurchase={loadCards}
                  />
                </div>
              } />
              
              <Route path="/account" element={
                <UserAccount user={user} />
              } />
              
              <Route path="/admin" element={
                <AdminPanel user={user} onCardUpdate={loadCards} />
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </CartProvider>
  )
}

export default App