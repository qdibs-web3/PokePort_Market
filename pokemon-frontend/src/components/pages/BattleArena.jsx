// src/pages/BattleArena.jsx
import React, { useEffect, useState, useRef } from 'react'

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))
const DEFAULT_HP_SCALE = 2.0 // Same for both player and AI for fair battles
const CRIT_CHANCE = 0.0625 // 6.25%
const CRIT_MULT = 1.5

const styles = `
.battle-shake { transform: translateX(0); transition: transform 120ms ease; }
.battle-hit { animation: hitFlash 260ms ease; }
@keyframes hitFlash {
  0% { filter: brightness(1); transform: translateX(0); }
  25% { filter: brightness(1.25); transform: translateX(-6px); }
  50% { filter: brightness(0.9); transform: translateX(6px); }
  100% { filter: brightness(1); transform: translateX(0); }
}
.battle-faint { opacity: 0.25; transform: scale(0.98); transition: opacity 300ms, transform 300ms; }
.battle-card { transition: all 0.3s ease; }
.battle-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
`

// --- Helpers: caching fetch wrappers ---
const getSessionCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
const setSessionCache = (key, val) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(val))
  } catch {}
}

// safe fetch wrapper
async function safeFetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch failed: ${url}`)
  return res.json()
}

// --- PokeAPI helpers with caching ---
async function fetchPokemonFull(nameOrId) {
  const key = `poke:pokemon:${nameOrId}`
  const cached = getSessionCache(key)
  if (cached) return cached
  const json = await safeFetchJson(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(String(nameOrId).toLowerCase())}`)
  // transform into a compact object
  const transformed = {
    id: json.id,
    name: json.name,
    sprite: json.sprites?.front_default || json.sprites?.other?.['official-artwork']?.front_default || null,
    types: json.types.map(t => t.type.name),
    stats: json.stats.reduce((acc, s) => ({ ...acc, [s.stat.name]: s.base_stat }), {}),
    movesList: json.moves.map(m => ({ name: m.move.name, url: m.move.url }))
  }
  setSessionCache(key, transformed)
  return transformed
}

// fetch move details (power, type, accuracy, name)
async function fetchMove(moveUrlOrName) {
  const name = typeof moveUrlOrName === 'string' && moveUrlOrName.includes('http') ? moveUrlOrName : `https://pokeapi.co/api/v2/move/${moveUrlOrName}`
  const cached = getSessionCache(`poke:move:${name}`)
  if (cached) return cached
  const json = await safeFetchJson(name)
  const mv = {
    name: json.name,
    power: json.power || null,
    pp: json.pp || null,
    type: json.type?.name || 'normal',
    accuracy: json.accuracy || null,
  }
  setSessionCache(`poke:move:${name}`, mv)
  return mv
}

// fetch type damage relations (attack type -> multipliers vs other types)
async function fetchTypeRelations(typeName) {
  const key = `poke:type:${typeName}`
  const cached = getSessionCache(key)
  if (cached) return cached
  const json = await safeFetchJson(`https://pokeapi.co/api/v2/type/${typeName}`)
  // build a map of targetType -> multiplier
  const map = {}
  ;(json.damage_relations?.double_damage_to || []).forEach(t => (map[t.name] = 2))
  ;(json.damage_relations?.half_damage_to || []).forEach(t => (map[t.name] = 0.5))
  ;(json.damage_relations?.no_damage_to || []).forEach(t => (map[t.name] = 0))
  setSessionCache(key, map)
  return map
}

// choose up to 4 real moves for a Pokémon (prefers moves with power)
async function selectMovesForPokemon(pokemon, limit = 4) {
  const key = `poke:selectedMoves:${pokemon.name}`
  const cached = getSessionCache(key)
  if (cached) return cached
  const candidates = pokemon.movesList.slice()
  const moves = []
  for (let i = 0; i < candidates.length && moves.length < limit; i++) {
    const entry = candidates[i]
    try {
      const mv = await fetchMove(entry.url || entry.name)
      if (mv.power || Math.random() < 0.05) {
        moves.push(mv)
      }
    } catch {
      // ignore fetch errors
    }
  }
  // If none found, synthesize basic moves
  while (moves.length < limit) {
    moves.push({ name: 'Tackle', power: 40, type: pokemon.types[0] || 'normal', accuracy: 100 })
  }
  setSessionCache(key, moves)
  return moves
}

// --- Enhanced damage formula with accuracy check ---
async function computeDamageDetailed(attacker, defender, move) {
  const atk = Math.max(1, attacker.stats.attack || attacker.stats['special-attack'] || 50)
  const def = Math.max(1, defender.stats.defense || defender.stats['special-defense'] || 50)
  const movePower = Math.max(1, move.power || 40)

  // Accuracy check
  const accuracy = move.accuracy || 100
  const hitRoll = Math.random() * 100
  const missed = hitRoll > accuracy

  if (missed) {
    return { damage: 0, typeMult: 1, isCrit: false, missed: true }
  }

  // base damage
  const base = (atk / def) * movePower * 0.5 // Balanced multiplier

  // random factor
  const randomFactor = 0.85 + Math.random() * 0.3 // 0.85 - 1.15

  // type multiplier
  let typeMult = 1
  try {
    const relations = await fetchTypeRelations(move.type)
    for (const dt of defender.types) {
      const mult = relations[dt] ?? 1
      typeMult *= mult
    }
  } catch (e) {
    // if fetch fails, default multiplier = 1
  }

  // critical
  const isCrit = Math.random() < CRIT_CHANCE
  const critMult = isCrit ? CRIT_MULT : 1

  const damage = Math.max(1, Math.round(base * randomFactor * typeMult * critMult))
  return { damage, typeMult, isCrit, missed: false }
}

// --- Utility: fetch list of pokemon names for autocomplete (cached) ---
async function fetchPokemonNameList() {
  const key = 'poke:nameList:v1'
  const cached = getSessionCache(key)
  if (cached) return cached
  const json = await safeFetchJson('https://pokeapi.co/api/v2/pokemon?limit=2000')
  const names = json.results.map(r => r.name)
  setSessionCache(key, names)
  return names
}

// Get effectiveness message
function getEffectivenessMessage(mult) {
  if (mult === 0) return "no effect"
  if (mult >= 4) return "devastatingly effective"
  if (mult >= 2) return "super effective"
  if (mult <= 0.25) return "barely effective"
  if (mult <= 0.5) return "not very effective"
  return "normal"
}

// Format move name for display
function formatMoveName(name) {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// --- Component ---
const BattleArena = () => {
  // basic state
  const [pokemonList, setPokemonList] = useState([])
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [playerPokemon, setPlayerPokemon] = useState(null)
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [aiPokemon, setAiPokemon] = useState(null)
  const [playerHP, setPlayerHP] = useState(0)
  const [aiHP, setAiHP] = useState(0)
  const [playerMaxHP, setPlayerMaxHP] = useState(0)
  const [aiMaxHP, setAiMaxHP] = useState(0)
  const [playerMoves, setPlayerMoves] = useState([])
  const [aiMoves, setAiMoves] = useState([])
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [turnCount, setTurnCount] = useState(0)
  const [battleActive, setBattleActive] = useState(false)
  const mountedRef = useRef(true)
  const [loadingBattle, setLoadingBattle] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    return () => (mountedRef.current = false)
  }, [])

  // load name list once
  useEffect(() => {
    fetchPokemonNameList().then(list => {
      if (!mountedRef.current) return
      setPokemonList(list)
    }).catch(() => {})
  }, [])

  // debounce autocomplete
  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([])
      return
    }
    const q = query.toLowerCase()
    const timer = setTimeout(() => {
      const matches = pokemonList.filter(n => n.includes(q)).slice(0, 8)
      setSuggestions(matches)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, pokemonList])

  // helper logs (prepend newest - properly reversed)
  const pushLog = (entry) => {
    setLog(prev => [entry, ...prev].slice(0, 150))
  }

  // choose random pokemon id in safe range
  const pickRandomBasic = async () => {
    const max = 898
    const id = Math.floor(Math.random() * max) + 1
    return fetchPokemonFull(id)
  }

  // prepare teams and start battle
  const startBattle = async (playerName = null) => {
    setLoadingBattle(true)
    setLog([])
    setMessage('')
    setTurnCount(0)
    setBattleActive(false)
    try {
      // build player pokemon
      let player
      if (playerName && playerName.trim()) {
        try {
          player = await fetchPokemonFull(playerName.trim())
        } catch {
          player = await pickRandomBasic()
        }
      } else {
        player = await pickRandomBasic()
      }

      // build AI pokemon (random)
      const ai = await pickRandomBasic()

      // fetch moves
      const pMoves = await selectMovesForPokemon(player, 4)
      const aMoves = await selectMovesForPokemon(ai, 4)

      // HP values - SAME SCALE for fair battles
      const pMaxHP = Math.max(1, Math.round((player.stats.hp || 50) * DEFAULT_HP_SCALE))
      const aMaxHP = Math.max(1, Math.round((ai.stats.hp || 50) * DEFAULT_HP_SCALE))

      if (!mountedRef.current) return

      setPlayerPokemon(player)
      setAiPokemon(ai)
      setPlayerMoves(pMoves)
      setAiMoves(aMoves)
      setPlayerHP(pMaxHP)
      setAiHP(aMaxHP)
      setPlayerMaxHP(pMaxHP)
      setAiMaxHP(aMaxHP)
      setBattleActive(true)
      
      // Enhanced battle start log - single entry to preserve order
      pushLog(`╔════════════════════════════════════════╗
║           BATTLE STARTED!        
╚════════════════════════════════════════╝

👤 YOUR POKÉMON: ${player.name.toUpperCase()}
   Types: ${player.types.map(t => t.toUpperCase()).join(', ')}
   HP: ${pMaxHP} | ATK: ${player.stats.attack} | DEF: ${player.stats.defense} | SPD: ${player.stats.speed}

🤖 OPPONENT: ${ai.name.toUpperCase()}
   Types: ${ai.types.map(t => t.toUpperCase()).join(', ')}
   HP: ${aMaxHP} | ATK: ${ai.stats.attack} | DEF: ${ai.stats.defense} | SPD: ${ai.stats.speed}

The battle begins! Choose your move!
`)
      
      setMessage('Battle Started! Choose your move!')
    } catch (err) {
      console.error(err)
      pushLog('❌ Failed to start battle (API errors). Try again.')
      setMessage('Error starting battle.')
    } finally {
      if (mountedRef.current) setLoadingBattle(false)
    }
  }

  // handle player using a move
  const playerUseMoveIndex = async (moveIdx) => {
    if (busy || !battleActive) return
    if (!playerPokemon || !aiPokemon) return
    if (playerHP <= 0 || aiHP <= 0) return

    setBusy(true)
    const currentTurn = turnCount + 1
    setTurnCount(currentTurn)

    const move = playerMoves[moveIdx] || playerMoves[0]
    const mv = { name: move.name, power: move.power || 40, type: move.type || playerPokemon.types[0] || 'normal', accuracy: move.accuracy || 100 }

    pushLog(`╭────────────────────────────────────────╮`)
    pushLog(`│           TURN ${currentTurn}                        `)
    pushLog(`╰────────────────────────────────────────╯`)

    // Determine turn order based on speed
    const playerSpeed = playerPokemon.stats.speed || 50
    const aiSpeed = aiPokemon.stats.speed || 50
    const playerFirst = playerSpeed >= aiSpeed

    if (playerFirst) {
      pushLog(`⚡ ${playerPokemon.name.toUpperCase()} moves first! (Speed: ${playerSpeed})`)
      pushLog(``)
      await executePlayerTurn(mv, currentTurn)
      if (aiHP > 0 && battleActive) {
        await new Promise(r => setTimeout(r, 800))
        await executeAiTurn(currentTurn)
      }
    } else {
      pushLog(`⚡ ${aiPokemon.name.toUpperCase()} moves first! (Speed: ${aiSpeed})`)
      pushLog(``)
      await executeAiTurn(currentTurn)
      if (playerHP > 0 && battleActive) {
        await new Promise(r => setTimeout(r, 800))
        await executePlayerTurn(mv, currentTurn)
      }
    }

    pushLog(``)
    setBusy(false)
  }

  const executePlayerTurn = async (mv, turn) => {
    if (!battleActive || playerHP <= 0 || aiHP <= 0) return

    const moveName = formatMoveName(mv.name)
    pushLog(`👤 ${playerPokemon.name.toUpperCase()} used ${moveName}!`)
    pushLog(`   └─ Type: ${mv.type.toUpperCase()} | Power: ${mv.power} | Accuracy: ${mv.accuracy}%`)

    // compute damage
    const { damage, typeMult, isCrit, missed } = await computeDamageDetailed(playerPokemon, aiPokemon, mv)

    if (missed) {
      pushLog(`   └─ 💨 The attack MISSED!`)
      pushLog(``)
      setMessage(`${playerPokemon.name}'s attack missed!`)
      return
    }

    // Update AI HP
    const newAiHP = Math.max(0, aiHP - damage)
    setAiHP(newAiHP)

    const effectiveness = getEffectivenessMessage(typeMult)
    const critText = isCrit ? ' [CRITICAL HIT!]' : ''
    const typeMultText = typeMult !== 1 ? ` (×${typeMult.toFixed(1)} ${effectiveness})` : ''
    
    pushLog(`   └─ 💥 Hit for ${damage} damage!${critText}${typeMultText}`)
    pushLog(`   └─ 🤖 ${aiPokemon.name}'s HP: ${newAiHP}/${aiMaxHP} (${Math.round((newAiHP/aiMaxHP)*100)}%)`)
    pushLog(``)

    setMessage(`${playerPokemon.name} dealt ${damage} damage!`)

    await new Promise(r => setTimeout(r, 450))

    // check faint
    if (newAiHP <= 0) {
      pushLog(`╔════════════════════════════════════════╗`)
      pushLog(`║   💀 ${aiPokemon.name.toUpperCase()} FAINTED!`)
      pushLog(`╚════════════════════════════════════════╝`)
      pushLog(``)
      pushLog(`🎉 VICTORY! You won in ${turn} turns!`)
      pushLog(``)
      pushLog(`📊 BATTLE SUMMARY:`)
      pushLog(`   • Your ${playerPokemon.name}: ${playerHP}/${playerMaxHP} HP remaining`)
      pushLog(`   • Opponent ${aiPokemon.name}: Defeated`)
      pushLog(`   • Total turns: ${turn}`)
      pushLog(``)
      
      setMessage('🎉 You win!')
      setBattleActive(false)
    }
  }

  const executeAiTurn = async (turn) => {
    if (!battleActive || aiHP <= 0 || playerHP <= 0) return

    // choose a random move
    const choice = aiMoves[Math.floor(Math.random() * aiMoves.length)] || { name: 'Tackle', power: 40, type: aiPokemon.types[0] || 'normal', accuracy: 100 }
    const mv = { name: choice.name, power: choice.power || 40, type: choice.type || aiPokemon.types[0] || 'normal', accuracy: choice.accuracy || 100 }

    const moveName = formatMoveName(mv.name)
    pushLog(`🤖 ${aiPokemon.name.toUpperCase()} used ${moveName}!`)
    pushLog(`   └─ Type: ${mv.type.toUpperCase()} | Power: ${mv.power} | Accuracy: ${mv.accuracy}%`)

    const { damage, typeMult, isCrit, missed } = await computeDamageDetailed(aiPokemon, playerPokemon, mv)

    if (missed) {
      pushLog(`   └─ 💨 The attack MISSED!`)
      pushLog(``)
      setMessage(`${aiPokemon.name}'s attack missed!`)
      return
    }

    // Update player HP
    const newPlayerHP = Math.max(0, playerHP - damage)
    setPlayerHP(newPlayerHP)

    const effectiveness = getEffectivenessMessage(typeMult)
    const critText = isCrit ? ' [CRITICAL HIT!]' : ''
    const typeMultText = typeMult !== 1 ? ` (×${typeMult.toFixed(1)} ${effectiveness})` : ''
    
    pushLog(`   └─ 💥 Hit for ${damage} damage!${critText}${typeMultText}`)
    pushLog(`   └─ 👤 ${playerPokemon.name}'s HP: ${newPlayerHP}/${playerMaxHP} (${Math.round((newPlayerHP/playerMaxHP)*100)}%)`)
    pushLog(``)

    setMessage(`${aiPokemon.name} dealt ${damage} damage!`)

    await new Promise(r => setTimeout(r, 300))

    // check faint
    if (newPlayerHP <= 0) {
      pushLog(`╔════════════════════════════════════════╗`)
      pushLog(`║   💀 ${playerPokemon.name.toUpperCase()} FAINTED!`)
      pushLog(`╚════════════════════════════════════════╝`)
      pushLog(``)
      pushLog(`DEFEAT! You lost in ${turn} turns.`)
      pushLog(``)
      pushLog(`📊 BATTLE SUMMARY:`)
      pushLog(`   • Your ${playerPokemon.name}: Defeated`)
      pushLog(`   • Opponent ${aiPokemon.name}: ${aiHP}/${aiMaxHP} HP remaining`)
      pushLog(`   • Total turns: ${turn}`)
      pushLog(``)
      
      setMessage('You lost — try again!')
      setBattleActive(false)
    }
  }

  // helper UI: show move label
  const moveLabel = (m) => {
    const name = formatMoveName(m?.name || 'Move')
    return `${name} ${m?.power ? `(${m.power})` : ''}`
  }

  const getHPPercentage = (current, max) => {
    return clamp((current / Math.max(1, max)) * 100, 0, 100)
  }

  const getHPColor = (percentage) => {
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // UI render
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <style>{styles}</style>
      <h1 className="text-3xl font-bold mb-2 text-center">Pokémon Battle Arena</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">1v1 Turn-Based Combat</p>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Setup */}
        <div className="lg:col-span-2">
          {/* Team chooser + start */}
          <div className="mb-4 p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
            <h3 className="font-semibold mb-3">Choose Your Pokémon</h3>
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              <div className="flex-1">
                {/* Selected Pokémon chip */}
                {selectedPokemon && (
                    <div className="flex items-center space-x-2 mb-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-sm">
                    <span className="capitalize">{selectedPokemon}</span>
                    <button
                        type="button"
                        className="text-blue-700 dark:text-blue-300 font-bold"
                        onClick={() => setSelectedPokemon(null)}
                    >
                        ✕
                    </button>
                    </div>
                )}

                {/* Input */}
                <input
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type a Pokémon name (e.g., pikachu, charizard)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loadingBattle}
                />

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border rounded-lg mt-2 max-h-48 overflow-auto shadow-lg z-50">
                    {suggestions.map(s => (
                        <div 
                        key={s} 
                        className={`px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer capitalize transition-colors ${
                            s === selectedPokemon ? "bg-blue-100 dark:bg-blue-900" : ""
                        }`}
                        onClick={() => {
                            setSelectedPokemon(s);
                            setQuery(""); // clear input after selection
                        }}
                        >
                        {s}
                        </div>
                    ))}
                    </div>
                )}
                </div>

              <button
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                    if (!selectedPokemon) return
                    startBattle(selectedPokemon)
                }}
                disabled={loadingBattle || !selectedPokemon} // use selectedPokemon instead of query
                >
                Start Battle
              </button>

              <button
                className="px-6 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => startBattle(null)}
                disabled={loadingBattle}
              >
                Random Battle
              </button>
            </div>

            <div className="mt-3 text-sm text-gray-500">
              💡 Tip: Type to search, or click Random Battle for instant action!
            </div>
          </div>

          {/* battlefield */}
          <div className="rounded-lg border-2 p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 shadow-lg relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Player side */}
              <div className="text-center">
                <h3 className="font-bold text-lg mb-4 text-blue-700 dark:text-blue-400">👤 YOUR POKÉMON</h3>
                {!playerPokemon ? (
                  <div className="p-8 rounded-lg border-2 border-dashed border-gray-300 bg-white dark:bg-gray-800">
                    <p className="text-gray-500">Choose a Pokémon to begin!</p>
                  </div>
                ) : (
                  <div className={`battle-card p-6 rounded-xl border-2 bg-white dark:bg-gray-800 shadow-lg ${playerHP <= 0 ? 'battle-faint border-gray-300' : 'border-blue-400'}`}>
                    <div className="flex flex-col items-center">
                      {playerPokemon.sprite ? (
                        <img 
                          src={playerPokemon.sprite} 
                          alt={playerPokemon.name} 
                          className={`w-32 h-32 object-contain ${playerHP <= 0 ? 'battle-faint' : ''}`} 
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-lg" />
                      )}
                      <p className="capitalize mt-3 text-xl font-bold">{playerPokemon.name}</p>
                      <div className="flex gap-2 mt-2">
                        {playerPokemon.types.map(t => (
                          <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-lg font-semibold mt-3">HP: {playerHP}/{playerMaxHP}</p>
                      <div className="mt-2 w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                        <div 
                          className={`h-4 transition-all duration-500 ${getHPColor(getHPPercentage(playerHP, playerMaxHP))}`}
                          style={{ width: `${getHPPercentage(playerHP, playerMaxHP)}%` }} 
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Speed: {playerPokemon.stats.speed || 50}</p>
                    </div>
                  </div>
                )}

                {/* Moves */}
                {playerPokemon && battleActive && playerHP > 0 && aiHP > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Choose Your Move:</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {playerMoves.map((m, idx) => (
                        <button
                          key={m.name + idx}
                          onClick={() => playerUseMoveIndex(idx)}
                          disabled={busy}
                          className="battle-card px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{moveLabel(m)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">{m.type}</div>
                          {m.accuracy && m.accuracy < 100 && (
                            <div className="text-xs text-orange-500 mt-1">Acc: {m.accuracy}%</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI side */}
              <div className="text-center">
                <h3 className="font-bold text-lg mb-4 text-red-700 dark:text-red-400">🤖 DEVS POKÉMON</h3>
                {!aiPokemon ? (
                  <div className="p-8 rounded-lg border-2 border-dashed border-gray-300 bg-white dark:bg-gray-800">
                    <p className="text-gray-500">Waiting for opponent...</p>
                  </div>
                ) : (
                  <div className={`battle-card p-6 rounded-xl border-2 bg-white dark:bg-gray-800 shadow-lg ${aiHP <= 0 ? 'battle-faint border-gray-300' : 'border-red-400'}`}>
                    <div className="flex flex-col items-center">
                      {aiPokemon.sprite ? (
                        <img 
                          src={aiPokemon.sprite} 
                          alt={aiPokemon.name} 
                          className={`w-32 h-32 object-contain ${aiHP <= 0 ? 'battle-faint' : ''}`} 
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-lg" />
                      )}
                      <p className="capitalize mt-3 text-xl font-bold">{aiPokemon.name}</p>
                      <div className="flex gap-2 mt-2">
                        {aiPokemon.types.map(t => (
                          <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-lg font-semibold mt-3">HP: {aiHP}/{aiMaxHP}</p>
                      <div className="mt-2 w-full bg-gray-200 h-4 rounded-full overflow-hidden">
                        <div 
                          className={`h-4 transition-all duration-500 ${getHPColor(getHPPercentage(aiHP, aiMaxHP))}`}
                          style={{ width: `${getHPPercentage(aiHP, aiMaxHP)}%` }} 
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Speed: {aiPokemon.stats.speed || 50}</p>
                    </div>
                  </div>
                )}

                {aiPokemon && (
                  <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm text-gray-600 dark:text-gray-400">The opponent will choose moves automatically</p>
                  </div>
                )}
              </div>
            </div>

            {/* VS Label - Centered between containers */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-red-600 text-white font-bold text-2xl px-6 py-3 rounded-full shadow-xl border-4 border-white">
                VS
              </div>
            </div>

            {/* Battle Status */}
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 text-center">
              <p className="font-semibold text-lg">{message || 'Waiting for battle to start...'}</p>
              {battleActive && <p className="text-sm text-gray-500 mt-1">Turn: {turnCount}</p>}
            </div>
          </div>
        </div>

        {/* Right column: Battle Log */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border-2 p-4 h-full bg-white dark:bg-gray-900 shadow-lg">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              Battle Log
              {turnCount > 0 && <span className="text-sm font-normal text-gray-500">(Turn {turnCount})</span>}
            </h4>
            <div className="space-y-1 max-h-[600px] overflow-auto font-mono text-xs">
              {log.length === 0 && (
                <p className="text-sm text-gray-500 italic">Battle logs will appear here...</p>
              )}
              {log.slice().reverse().map((l, idx) => (
                <div 
                  key={idx} 
                  className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed"
                >
                  {l}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Damage is calculated using attack/defense stats, move power, type effectiveness, accuracy, and critical hits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BattleArena