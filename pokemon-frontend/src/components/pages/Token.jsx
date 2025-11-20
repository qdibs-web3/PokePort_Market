// src/components/pages/Token.jsx
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { TrendingUp, TrendingDown, DollarSign, Users, Zap, Trophy, Sparkles, Coins } from 'lucide-react'
import pbImage from '/src/assets/pb.png'
import wizchu from '/src/assets/wizardchu.png'


const Token = () => {
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Market cap milestones (in dollars)
  const milestones = [
    { value: 0, label: '$0' },
    { value: 100000, label: '$100K' },
    { value: 250000, label: '$250K' },
    { value: 500000, label: '$500K' },
    { value: 750000, label: '$750K' },
    { value: 1000000, label: '$1M' },
    { value: 2000000, label: '$2M' }
  ]

  const maxMilestone = 2000000

  // Fetch market data from DexScreener API
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          'https://api.dexscreener.com/latest/dex/pairs/base/0x294799c95eab673d44c37e96ce350ff9e66e6a70'
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch market data')
        }

        const data = await response.json()
        
        if (data.pair) {
          setMarketData(data.pair)
        } else if (data.pairs && data.pairs.length > 0) {
          setMarketData(data.pairs[0])
        } else {
          throw new Error('No market data available')
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching market data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Calculate progress percentage for the milestone bar
  const getProgressPercentage = () => {
    if (!marketData?.marketCap) return 0
    const currentMarketCap = parseFloat(marketData.marketCap)
    const percentage = (currentMarketCap / maxMilestone) * 100
    return Math.min(percentage, 100)
  }

  // Get position of each milestone marker
  const getMilestonePosition = (milestoneValue) => {
    return (milestoneValue / maxMilestone) * 100
  }

  // Check if milestone is reached
  const isMilestoneReached = (milestoneValue) => {
    if (!marketData?.marketCap) return false
    return parseFloat(marketData.marketCap) >= milestoneValue
  }

  // Format large numbers
  const formatNumber = (num) => {
    if (!num) return '0'
    const number = parseFloat(num)
    if (number >= 1000000) {
      return `$${(number / 1000000).toFixed(2)}M`
    } else if (number >= 1000) {
      return `$${(number / 1000).toFixed(2)}K`
    }
    return `$${number.toFixed(2)}`
  }

  // Format price with appropriate decimals
  const formatPrice = (price) => {
    if (!price) return '$0.00'
    const num = parseFloat(price)
    if (num < 0.000001) {
      return `$${num.toExponential(2)}`
    } else if (num < 0.01) {
      return `$${num.toFixed(6)}`
    }
    return `$${num.toFixed(4)}`
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-2 sm:px-4">
      {/* Header Section */}
      <div className="text-center space-y-4 py-4 sm:py-6">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <img 
            src={wizchu} 
            alt="Pokeball" 
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 animate-bounce"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent pokemon-font">
            $POKE
          </h1>
        </div>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
          The Official PokéPort Memecoin - Gotta Catch 'Em All! 🚀
        </p>
        
        {loading && (
          <Badge variant="outline" className="text-sm sm:text-base animate-pulse">
            Loading market data...
          </Badge>
        )}
        
        {error && (
          <Badge variant="destructive" className="text-sm sm:text-base">
            {error}
          </Badge>
        )}
      </div>

      {/* Market Cap Milestone Progress Bar */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-500 dark:border-blue-600 shadow-xl overflow-hidden">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center flex items-center justify-center gap-2 text-gray-900 dark:text-gray-100">
            Market Cap Journey
          </CardTitle>
          
          {marketData && (
            <div className="text-center mt-2 sm:mt-4">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(marketData.marketCap)}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Current Market Cap
              </p>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {/* Progress Bar Container */}
          <div className="relative w-full mb-12 sm:mb-16">
            <div className="relative w-full h-16 sm:h-20 md:h-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              {/* Animated Progress Fill */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 transition-all duration-1000 ease-out shadow-lg"
                style={{ width: `${getProgressPercentage()}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>

              {/* Milestone Markers */}
              {milestones.map((milestone, index) => {
                const position = getMilestonePosition(milestone.value)
                const reached = isMilestoneReached(milestone.value)
                
                return (
                  <div
                    key={index}
                    className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center transform -translate-x-1/2 z-10"
                    style={{ left: `${position}%` }}
                  >
                    {/* Pokeball Marker */}
                    <div className={`relative transition-all duration-500 ${
                      reached ? 'scale-110' : 'scale-100 opacity-60'
                    }`}>
                      <img
                        src={pbImage}
                        alt="Milestone"
                        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 drop-shadow-lg ${
                          reached ? 'animate-bounce' : ''
                        }`}
                      />
                      {reached && (
                        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Milestone Labels Below Progress Bar */}
            <div className="relative w-full mt-3 sm:mt-4">
              {milestones.map((milestone, index) => {
                const position = getMilestonePosition(milestone.value)
                const reached = isMilestoneReached(milestone.value)
                
                return (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2"
                    style={{ left: `${position}%` }}
                  >
                    <span className={`block text-[10px] sm:text-xs md:text-sm font-bold whitespace-nowrap px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                      reached
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {milestone.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Stats Grid */}
      {marketData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Price Card */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-600 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(marketData.priceUsd)}
              </p>
              {marketData.priceChange && (
                <div className={`flex items-center gap-1 mt-2 text-xs sm:text-sm ${
                  parseFloat(marketData.priceChange.h24) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {parseFloat(marketData.priceChange.h24) >= 0 ? (
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span>{Math.abs(parseFloat(marketData.priceChange.h24)).toFixed(2)}% (24h)</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume Card */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-600 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                Volume 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(marketData.volume?.h24)}
              </p>
            </CardContent>
          </Card>

          {/* Liquidity Card */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-600 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                Liquidity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(marketData.liquidity?.usd)}
              </p>
            </CardContent>
          </Card>

          {/* Transactions Card */}
          <Card className="bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-600 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                Transactions 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {marketData.txns?.h24?.buys + marketData.txns?.h24?.sells || 0}
              </p>
              <div className="flex gap-3 sm:gap-4 mt-2 text-xs sm:text-sm">
                <span className="text-green-600 dark:text-green-400">
                  ↑ {marketData.txns?.h24?.buys || 0}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  ↓ {marketData.txns?.h24?.sells || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Epic Pokemon-Themed Memecoin Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* About $POKE */}
        <Card className="bg-gradient-to-br from-yellow-50 to-red-50 dark:from-yellow-900/20 dark:to-red-900/20 border-2 border-blue-500 dark:border-blue-600">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <img src={pbImage} alt="Pokeball" className="w-6 h-6 sm:w-8 sm:h-8" />
              About $POKE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base">
            <p className="text-gray-700 dark:text-gray-300">
              $POKE is the official memecoin of the PokéPort ecosystem, bringing together collectors, 
              trainers, and crypto enthusiasts in an epic journey to catch financial freedom!
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Community-Driven:</strong> Built by trainers, for trainers
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Utility Token:</strong> Use $POKE for exclusive marketplace features
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Rewards System:</strong> Earn $POKE through trading and participation
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokenomics */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-500 dark:border-blue-600">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
              Tokenomics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border-2 border-blue-500 dark:border-blue-600">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Supply</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">1B $POKE</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border-2 border-blue-500 dark:border-blue-600">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Tax</p>
                <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">0%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border-2 border-blue-500 dark:border-blue-600">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">LP Locked</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">100%</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border-2 border-blue-500 dark:border-blue-600">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ownership</p>
                <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">Renounced</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roadmap */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-blue-500 dark:border-blue-600">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center flex items-center justify-center gap-2 text-gray-900 dark:text-gray-100">
            Evolution Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Phase 1 */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border-2 border-blue-500 dark:border-blue-600 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Badge className="bg-yellow-500 text-white text-xs sm:text-sm">Phase 1</Badge>
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">Launch</h3>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <li>✅ Token Creation</li>
                <li>✅ Website Launch</li>
                <li>✅ Community Building</li>
                <li>✅ Initial Marketing</li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border-2 border-blue-500 dark:border-blue-600 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Badge className="bg-blue-500 text-white text-xs sm:text-sm">Phase 2</Badge>
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">Growth</h3>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <li>🔄 CEX Listings</li>
                <li>🔄 Partnerships</li>
                <li>🔄 Staking Platform</li>
                <li>🔄 NFT Integration</li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border-2 border-blue-500 dark:border-blue-600 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Badge className="bg-purple-500 text-white text-xs sm:text-sm">Phase 3</Badge>
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">Expansion</h3>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <li>📋 Metaverse Integration</li>
                <li>📋 Gaming Platform</li>
                <li>📋 Global Marketing</li>
                <li>📋 Major Exchange Listings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 border-0 text-white">
        <CardContent className="py-6 sm:py-8 md:py-12 text-center space-y-3 sm:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Ready to Join the Adventure?</h2>
          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
            Become part of the PokéPort revolution and help us reach the next milestone!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4 px-4">
            <a
              href="https://dexscreener.com/base/0x294799c95eab673d44c37e96ce350ff9e66e6a70"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-purple-600 px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg text-sm sm:text-base w-full sm:w-auto"
            >
              View on DexScreener
            </a>
            <button className="bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg text-sm sm:text-base w-full sm:w-auto">
              Buy $POKE Now
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Token