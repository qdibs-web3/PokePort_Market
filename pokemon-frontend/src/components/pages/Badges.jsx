import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Award, Lock, CheckCircle2, Trophy, Star, Zap, Flame, Droplets, Leaf, Ghost, Mountain, Bird, Brain, ShieldAlert } from 'lucide-react'

const BADGE_DEFINITIONS = [
  { id: 'first_catch', name: 'First Catch', description: 'Catch 1 Pokémon', icon: Star, color: 'text-yellow-500' },
  { id: 'novice_collector', name: 'Novice Collector', description: 'Catch 10 Pokémon', icon: Award, color: 'text-blue-400' },
  { id: 'kanto_explorer', name: 'Kanto Explorer', description: 'Catch 25 Pokémon', icon: Mountain, color: 'text-green-500' },
  { id: 'rising_star', name: 'Rising Star', description: 'Catch 50 Pokémon', icon: Zap, color: 'text-yellow-400' },
  { id: 'century_club', name: 'Century Club', description: 'Catch 100 Pokémon', icon: Trophy, color: 'text-orange-500' },
  { id: 'kanto_master', name: 'Kanto Master', description: 'Catch all 151 Pokémon', icon: Trophy, color: 'text-purple-600' },
  { id: 'starter_squad', name: 'Starter Squad', description: 'Catch Bulbasaur, Charmander, and Squirtle', icon: CheckCircle2, color: 'text-red-500' },
  { id: 'evolution_expert', name: 'Evolution Expert', description: 'Catch 10 evolved forms', icon: Zap, color: 'text-indigo-500' },
  { id: 'forest_dweller', name: 'Forest Dweller', description: 'Catch 5 Bug-type Pokémon', icon: Leaf, color: 'text-green-600' },
  { id: 'mountain_hiker', name: 'Mountain Hiker', description: 'Catch 5 Rock or Ground-type Pokémon', icon: Mountain, color: 'text-amber-700' },
  { id: 'swimmer', name: 'Swimmer', description: 'Catch 10 Water-type Pokémon', icon: Droplets, color: 'text-blue-600' },
  { id: 'bird_watcher', name: 'Bird Watcher', description: 'Catch 10 Flying-type Pokémon', icon: Bird, color: 'text-sky-400' },
  { id: 'electrician', name: 'Electrician', description: 'Catch 5 Electric-type Pokémon', icon: Zap, color: 'text-yellow-300' },
  { id: 'psychic_master', name: 'Psychic Master', description: 'Catch 5 Psychic-type Pokémon', icon: Brain, color: 'text-pink-500' },
  { id: 'ghost_hunter', name: 'Ghost Hunter', description: 'Catch Gastly, Haunter, and Gengar', icon: Ghost, color: 'text-purple-800' },
  { id: 'dragon_tamer', name: 'Dragon Tamer', description: 'Catch Dratini, Dragonair, and Dragonite', icon: ShieldAlert, color: 'text-indigo-700' },
  { id: 'legendary_finder', name: 'Legendary Finder', description: 'Catch one Legendary Bird', icon: Star, color: 'text-yellow-600' },
  { id: 'the_chosen_one', name: 'The Chosen One', description: 'Catch Mewtwo', icon: Trophy, color: 'text-purple-900' },
  { id: 'hidden_myth', name: 'Hidden Myth', description: 'Catch Mew', icon: Star, color: 'text-pink-300' },
  { id: 'daily_dedicated', name: 'Daily Dedicated', description: 'Catch Pokémon on 7 different days', icon: CheckCircle2, color: 'text-emerald-500' },
]

const Badges = ({ user }) => {
  const [unlockedBadges, setUnlockedBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const walletAddress = user?.wallet_address || user?.walletAddress;
    if (walletAddress) {
      fetchUnlockedBadges(walletAddress)
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchUnlockedBadges = async (walletAddress) => {
    try {
      const response = await fetch(`/api/pokedex/${walletAddress}`)
      if (response.ok) {
        const data = await response.json()
        // The backend will now return badges in the user object
        // We'll also trigger a badge check on the backend to ensure everything is up to date
        const checkResponse = await fetch(`/api/pokedex/check-badges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: walletAddress })
        })
        
        if (checkResponse.ok) {
          const updatedData = await checkResponse.json()
          setUnlockedBadges(updatedData.badges || [])
        } else {
          setUnlockedBadges(data.user?.badges || [])
        }
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Award className="w-20 h-20 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Connect your wallet to view your achievements and unlock badges as you complete your Kanto Pokedex!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Trainer Achievements</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Unlock all 20 badges by catching Pokémon and completing challenges.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Badge variant="outline" className="px-4 py-1 text-sm">
            Unlocked: {unlockedBadges.length} / {BADGE_DEFINITIONS.length}
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {BADGE_DEFINITIONS.map((badge) => {
            const isUnlocked = unlockedBadges.some(ub => ub.badgeId === badge.id)
            const Icon = badge.icon
            
            return (
              <Card 
                key={badge.id} 
                className={`relative overflow-hidden transition-all duration-300 ${
                  isUnlocked 
                    ? 'border-blue-500/50 bg-white dark:bg-gray-900 shadow-md scale-100' 
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 opacity-75 grayscale'
                }`}
              >
                <CardHeader className="p-4 pb-2 text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isUnlocked ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {isUnlocked ? (
                      <Icon className={`w-8 h-8 ${badge.color}`} />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <CardTitle className={`text-sm font-bold ${isUnlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                    {badge.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                    {badge.description}
                  </p>
                  {isUnlocked && (
                    <div className="mt-2">
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-none text-[10px] h-5">
                        Unlocked
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Badges