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
  <div className="relative min-h-screen overflow-hidden text-gray-900 dark:text-gray-100">
    <div className="absolute inset-0 bg-[url('/pokeball-bg.svg')] bg-cover bg-center opacity-10 pointer-events-none" />
    <div className="relative z-10 p-6 space-y-10">


      {/* Quote of the Day */}
      <div className="rounded-xl shadow-lg border-2 border-amber-400 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6 animate-fadeIn">
        <h2 className="text-2xl font-bold text-center text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
          ✨ Pokémon Quote of the Day ✨
        </h2>
        <div className="mt-4 text-center">
          {loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
              Loading wisdom from the Pokédex…
            </p>
          ) : quote ? (
            <>
              <p className="italic text-lg text-gray-800 dark:text-gray-100 transition-all duration-700">
                “{quote.text}”
              </p>
              <p className="text-md text-amber-600 dark:text-amber-400 mt-2 font-semibold capitalize">
                — {quote.name}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No quote available.
            </p>
          )}
        </div>
      </div>

      {/* Trainer Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Pokémon Seen', value: 245 },
          { label: 'Pokémon Caught', value: 132 },
          { label: 'Market Listings', value: 57 },
          { label: 'Badges Earned', value: 8 },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-amber-200 bg-gradient-to-br from-yellow-200/80 to-amber-100/70 dark:from-gray-800 dark:to-gray-700 shadow hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm uppercase tracking-wide">
              {stat.label}
            </p>
            <h3 className="text-3xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">{stat.value}</h3>
          </div>
        ))}
      </section>

      {/* Explore / Shop / 3D Prints */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[ 
          {
            title: 'Card Explorer',
            img: epika,
            to: '/explore',
            gradient: 'from-yellow-300 to-orange-400',
            bullets: [
              'Browse all Pokémon generations',
              'View detailed card stats & rarities',
              'Track evolving market trends',
              'Unlock hidden Pokédex lore',
            ],
          },
          {
            title: 'Pokémon Market',
            img: spika,
            to: '/market',
            gradient: 'from-rose-400 to-pink-500',
            bullets: [
              'Buy & sell raw or graded cards',
              'Exclusive limited sets & bundles',
              'Custom-themed sleeves & cases',
              'Mystery boxes — coming soon!',
            ],
          },
          {
            title: 'Custom 3D Prints',
            img: ppika,
            to: '/market',
            gradient: 'from-sky-400 to-blue-500',
            bullets: [
              'Design personalized display stands',
              'Choose from legendary themes',
              'Perfect for collectors & streamers',
              'Community-inspired creations',
            ],
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`rounded-2xl shadow-xl p-6 bg-gradient-to-br ${item.gradient} text-white relative overflow-hidden transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300`}
          >
            <div className="absolute inset-0 bg-[url('/pokeball-bg.svg')] opacity-10 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <img src={item.img} alt={item.title} className="w-28 h-28 object-contain mb-3 drop-shadow-lg animate-bounce-slow" />
              <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
              <Link
                to={item.to}
                className="bg-white/20 hover:bg-white/40 px-4 py-1 rounded-full text-sm font-medium mb-4 transition-all"
              >
                Explore →
              </Link>
              <ul className="text-sm text-white/90 space-y-2 max-w-sm">
                {item.bullets.map((b, i) => (
                  <li key={i} className="flex items-start justify-center gap-2">
                    <img src={item.img} alt="" className="w-5 h-5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>
    </div>
  </div>
)
}
