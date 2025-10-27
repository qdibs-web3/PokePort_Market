// pokemon-frontend/src/components/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import epika from '/src/assets/epika.png'
import ppika from '/src/assets/ppika.png'
import spika from '/src/assets/spika.png'

export default function Dashboard() {
  const QUOTE_KEY = 'pokedex_quote_of_day_v1'

  function getTodayKey() {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  }

  const fetchRandomSpeciesQuote = async () => {
    try {
      const maxSpecies = 1010
      const randomId = Math.floor(Math.random() * maxSpecies) + 1
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomId}/`)
      if (!res.ok) throw new Error('species fetch failed')
      const data = await res.json()
      const entries = data.flavor_text_entries || []
      const english = entries.filter((e) => e.language?.name === 'en')
      if (english.length === 0) {
        return { name: data.name, text: `${data.name} — No trivia available.` }
      }
      const chosen = english[Math.floor(Math.random() * english.length)].flavor_text
      const cleaned = (chosen || '').replace(/\f|\n|\r/g, ' ').trim()
      return { name: data.name, text: cleaned }
    } catch (err) {
      console.error('fetchRandomSpeciesQuote error', err)
      return { name: 'PokéAPI', text: 'Could not fetch a quote right now — try again later.' }
    }
  }

  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tryLoad = async () => {
      setLoading(true)
      try {
        const todayKey = getTodayKey()
        const cachedRaw = localStorage.getItem(QUOTE_KEY)
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw)
            if (parsed?.date === todayKey && parsed?.quote) {
              setQuote(parsed.quote)
              setLoading(false)
              return
            }
          } catch {
            // ignore parse errors
          }
        }
        const q = await fetchRandomSpeciesQuote()
        setQuote(q)
        localStorage.setItem(QUOTE_KEY, JSON.stringify({ date: todayKey, quote: q }))
      } finally {
        setLoading(false)
      }
    }

    tryLoad()
  }, [])

  return (
    <div className="space-y-6">
      <div className="p-6">
        {/* Quote of the Day */}
        <div className="mb-6">
          <div className="rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-300 to-yellow-100 dark:from-amber-700 dark:to-yellow-900 p-4">
              <h2 className="text-lg font-semibold flex items-center gap-3">
                Pokémon Quote of the Day
              </h2>
              <div className="mt-2">
                {loading ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Loading quote…</p>
                ) : quote ? (
                  <>
                    <p className="italic text-md text-gray-800 dark:text-gray-100">“{quote.text}”</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      — <span className="capitalize">{quote.name}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">No quote available.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Intro Information Section - 3 Columns */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-yellow rounded-lg p-6">
          {/* Left Column */}
          <div className="flex flex-col items-center text-center">
            <img src={epika} alt="Card Explorer Logo" className="w-32 h-32 object-contain mb-4" />
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Card Explorer</h2>
              <Link
                to="/explore"
                className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full transition-colors"
              >
                Go
              </Link>
            </div>
            <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
              <li className="flex items-center">
                <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
                Browse all Pokémon generations
              </li>
              <li className="flex items-center">
                <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
                View detailed card stats and data
              </li>
              <li className="flex items-center">
                <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
                Track prices and rarity info
              </li>
              <li className="flex items-center">
                <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
                Explore release history
              </li>
            </ul>
          </div>

          {/* Middle Column */}
          <div className="flex flex-col items-center text-center">
            <img src={spika} alt="Shop Logo" className="w-32 h-32 object-contain mb-4" />
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Shop Pokémon</h2>
              <Link
                to="/market"
                className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full transition-colors"
              >
                Go
              </Link>
            </div>
            <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
              <li className="flex items-center">
                <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
                Raw & Graded Cards
              </li>
              <li className="flex items-center">
                <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
                High End Sealed Product
              </li>
              <li className="flex items-center">
                <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
                Customized Designs, Text, & Colors
              </li>
              <li className="flex items-center">
                <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
                Mystery Packs 'Coming Soon?'
              </li>
            </ul>
          </div>

          {/* Right Column */}
          <div className="flex flex-col items-center text-center">
            <img src={ppika} alt="3D Prints Logo" className="w-32 h-32 object-contain mb-4" />
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Custom 3D Prints</h2>
              <Link
                to="/market"
                className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full transition-colors"
              >
                Go
              </Link>
            </div>
            <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
              <li className="flex items-center">
                <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
                Order personalized card displays
              </li>
              <li className="flex items-center">
                <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
                Choose from multiple styles
              </li>
              <li className="flex items-center">
                <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
                Match your favorite Pokémon style
              </li>
              <li className="flex items-center">
                <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
                Community-inspired designs
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
