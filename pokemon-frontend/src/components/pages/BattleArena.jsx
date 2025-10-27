// src/pages/BattleArena.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react'

/**
 * BattleArena.jsx — upgraded
 *
 * Features added:
 * - sessionStorage caching of fetched Pokémon / moves / types (reduces PokeAPI requests)
 * - Type effectiveness multipliers using PokeAPI type damage relations
 * - Multiple Pokémon per side (team of up to TEAM_SIZE)
 * - Fetch real move names / types / power from PokeAPI (cached)
 * - Simple autocomplete for choosing Pokémon (debounced)
 * - Critical hit mechanic
 * - Small CSS animations for hit / faint effects
 * - Logs newest-first (we prepend log entries)
 *
 * Limitations / notes:
 * - All networking is client-side; for large scale use implement server-side caching.
 * - PokeAPI rate limits still apply; caching helps a lot within a session.
 */

const TEAM_SIZE = 3
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))
const DEFAULT_HP_SCALE = 1.0
const CRIT_CHANCE = 0.0625 // 6.25%
const CRIT_MULT = 1.5

// --- Simple CSS for animations (in-component) ---
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
  // default multiplier 1 for unknowns; we override for relations
  ;(json.damage_relations?.double_damage_to || []).forEach(t => (map[t.name] = 2))
  ;(json.damage_relations?.half_damage_to || []).forEach(t => (map[t.name] = 0.5))
  ;(json.damage_relations?.no_damage_to || []).forEach(t => (map[t.name] = 0))
  setSessionCache(key, map)
  return map
}

// choose up to 4 real moves for a Pokémon (prefers moves with power)
async function selectMovesForPokemon(pokemon, limit = 4) {
  // cached per pokemon
  const key = `poke:selectedMoves:${pokemon.name}`
  const cached = getSessionCache(key)
  if (cached) return cached
  const candidates = pokemon.movesList.slice().map(m => m) // use provided moves list
  // try sequentially until we have moves with power; limit calls
  const moves = []
  for (let i = 0; i < candidates.length && moves.length < limit; i++) {
    const entry = candidates[i]
    try {
      const mv = await fetchMove(entry.url || entry.name)
      // only accept moves with power or a few moves without power as fallback
      if (mv.power || Math.random() < 0.05) {
        moves.push(mv)
      }
    } catch {
      // ignore fetch errors
    }
  }
  // If none found, synthesize basic moves
  while (moves.length < limit) {
    moves.push({ name: 'Tackle', power: 12, type: pokemon.types[0] || 'normal' })
  }
  setSessionCache(key, moves)
  return moves
}

// --- Damage formula including type multiplier & crits ---
async function computeDamageDetailed(attacker, defender, move) {
  // attacker/defender have stats: stats.attack, stats.defense, stats.hp; types array
  // move: { power, type, name }
  const atk = Math.max(1, attacker.stats.attack || attacker.stats['special-attack'] || 50)
  const def = Math.max(1, defender.stats.defense || defender.stats['special-defense'] || 50)
  const movePower = Math.max(1, move.power || 10)

  // base damage
  const base = (atk / def) * movePower

  // random factor
  const randomFactor = 0.85 + Math.random() * 0.3 // 0.85 - 1.15

  // type multiplier: for each defender type, multiply
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
  return { damage, typeMult, isCrit }
}

// --- Utility: fetch list of pokemon names for autocomplete (cached) ---
async function fetchPokemonNameList() {
  const key = 'poke:nameList:v1'
  const cached = getSessionCache(key)
  if (cached) return cached
  // fetch a large limit to include many species
  const json = await safeFetchJson('https://pokeapi.co/api/v2/pokemon?limit=2000')
  const names = json.results.map(r => r.name)
  setSessionCache(key, names)
  return names
}

// --- Component ---
const BattleArena = () => {
  // basic state
  const [pokemonList, setPokemonList] = useState([]) // for autocomplete
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [playerTeams, setPlayerTeams] = useState([]) // array of pokemon objects (max TEAM_SIZE)
  const [aiTeams, setAiTeams] = useState([])
  const [activePlayerIndex, setActivePlayerIndex] = useState(0) // which team member is active (index)
  const [activeAiIndex, setActiveAiIndex] = useState(0)
  const [playerHPs, setPlayerHPs] = useState([]) // array of HPs
  const [aiHPs, setAiHPs] = useState([])
  const [playerMoves, setPlayerMoves] = useState({}) // name->moves array
  const [aiMoves, setAiMoves] = useState({})
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
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

  // helper logs (prepend newest)
  const pushLog = (entry) => setLog(prev => [entry, ...prev].slice(0, 150))

  // choose random pokemon id in safe range
  const pickRandomBasic = async () => {
    const max = 898
    const id = Math.floor(Math.random() * max) + 1
    return fetchPokemonFull(id)
  }

  // prepare teams and start battle
  const startBattle = async (playerNames = []) => {
    setLoadingBattle(true)
    setLog([])
    setMessage('')
    try {
      // build player team: use provided names (up to TEAM_SIZE) or defaults; ensure lowercase
      const players = []
      for (let i = 0; i < TEAM_SIZE; i++) {
        const name = (playerNames[i] && playerNames[i].trim()) || null
        if (name) {
          try {
            const p = await fetchPokemonFull(name)
            players.push(p)
          } catch {
            // fallback to random
            const r = await pickRandomBasic()
            players.push(r)
          }
        } else {
          const r = await pickRandomBasic()
          players.push(r)
        }
      }
      // build AI team (random)
      const ais = []
      for (let i = 0; i < TEAM_SIZE; i++) {
        const r = await pickRandomBasic()
        ais.push(r)
      }

      // fetch/select moves for each pokemon (concurrently)
      const playerMovesMap = {}
      const aiMovesMap = {}
      await Promise.all(players.map(async p => {
        playerMovesMap[p.name] = await selectMovesForPokemon(p, 4)
      }))
      await Promise.all(ais.map(async p => {
        aiMovesMap[p.name] = await selectMovesForPokemon(p, 4)
      }))

      // HP arrays (use base hp scaled to percent of some base)
      const pHPs = players.map(p => Math.max(1, Math.round((p.stats.hp || 50) * DEFAULT_HP_SCALE)))
      const aHPs = ais.map(a => Math.max(1, Math.round((a.stats.hp || 50) * DEFAULT_HP_SCALE)))

      if (!mountedRef.current) return

      setPlayerTeams(players)
      setAiTeams(ais)
      setPlayerMoves(playerMovesMap)
      setAiMoves(aiMovesMap)
      setPlayerHPs(pHPs)
      setAiHPs(aHPs)
      setActivePlayerIndex(0)
      setActiveAiIndex(0)
      pushLog(`Battle started: You (${players.map(p=>p.name).join(', ')}) vs AI (${ais.map(a=>a.name).join(', ')})`)
      setMessage('Battle engaged!')
    } catch (err) {
      console.error(err)
      pushLog('Failed to start battle (API errors). Try again.')
      setMessage('Error starting battle.')
    } finally {
      if (mountedRef.current) setLoadingBattle(false)
    }
  }

  // handle player using a move (index of move in player's move list)
  const playerUseMoveIndex = async (moveIdx) => {
    if (busy) return
    if (!playerTeams[activePlayerIndex] || !aiTeams[activeAiIndex]) return
    if (playerHPs[activePlayerIndex] <= 0 || aiHPs[activeAiIndex] <= 0) return
    setBusy(true)

    const attacker = playerTeams[activePlayerIndex]
    const defender = aiTeams[activeAiIndex]
    const moves = playerMoves[attacker.name] || []
    const move = moves[moveIdx] || moves[0]
    // ensure move has type & power; if not, synthesize
    const mv = { name: move.name, power: move.power || 10, type: move.type || attacker.types[0] || 'normal' }

    // compute damage
    const { damage, typeMult, isCrit } = await computeDamageDetailed(attacker, defender, mv)
    // subtract hp for AI
    setAiHPs(prev => {
      const copy = prev.slice()
      copy[activeAiIndex] = clamp(copy[activeAiIndex] - damage, 0, 99999)
      return copy
    })
    pushLog(`${attacker.name} used ${mv.name} and dealt ${damage} damage${isCrit ? ' (CRIT!)' : ''}${typeMult !== 1 ? ` (x${typeMult.toFixed(2)} type)` : ''}`)
    setMessage(`${attacker.name} used ${mv.name}!`)

    // animate hit by temporarily toggling a CSS class: we'll do this by updating a short-lived state key on the target (simple approach)
    await new Promise(r => setTimeout(r, 450))

    // check faint
    const aiRemaining = (aiHPs[activeAiIndex] ?? 0) - damage
    if (aiRemaining <= 0) {
      pushLog(`AI's ${defender.name} fainted!`)
      // find next alive ai member
      const nextAi = aiHPs.findIndex((hp, idx) => idx !== activeAiIndex && hp > 0)
      // note: use current state values to detect next; recreate arrays
      const newAiHPs = (await Promise.resolve(aiHPs)).slice()
      // Already updated in setAiHPs above; we'll check live
      const nextAlive = newAiHPs.findIndex(hp => hp > 0)
      if (newAiHPs.some(hp => hp > 0)) {
        // choose next active AI (first alive)
        const idx = newAiHPs.findIndex(hp => hp > 0)
        setActiveAiIndex(idx)
        pushLog(`AI sends out ${aiTeams[idx].name}!`)
      } else {
        pushLog('All AI Pokémon fainted! You win! 🎉')
        setMessage('You win!')
        setBusy(false)
        return
      }
    }

    // AI turn (small delay)
    await new Promise(r => setTimeout(r, 650))
    await aiTakeTurn()
    setBusy(false)
  }

  const aiTakeTurn = async () => {
    // ensure AI active and player active exist
    const ai = aiTeams[activeAiIndex]
    const player = playerTeams[activePlayerIndex]
    if (!ai || !player) return
    if ((aiHPs[activeAiIndex] ?? 0) <= 0) return
    // choose a random move
    const moves = aiMoves[ai.name] || []
    const choice = moves[Math.floor(Math.random() * moves.length)] || { name: 'Tackle', power: 10, type: ai.types[0] || 'normal' }
    const mv = { name: choice.name, power: choice.power || 10, type: choice.type || ai.types[0] || 'normal' }

    const { damage, typeMult, isCrit } = await computeDamageDetailed(ai, player, mv)

    // subtract player hp
    setPlayerHPs(prev => {
      const copy = prev.slice()
      copy[activePlayerIndex] = clamp(copy[activePlayerIndex] - damage, 0, 99999)
      return copy
    })

    pushLog(`AI's ${ai.name} used ${mv.name} and dealt ${damage} damage${isCrit ? ' (CRIT!)' : ''}${typeMult !== 1 ? ` (x${typeMult.toFixed(2)} type)` : ''}`)
    setMessage(`AI used ${mv.name}!`)

    // check faint and switch if needed
    await new Promise(r => setTimeout(r, 300))
    const remaining = (playerHPs[activePlayerIndex] ?? 0) - damage
    if (remaining <= 0) {
      pushLog(`${player.name} fainted!`)
      const nextIdx = playerHPs.findIndex((hp, idx) => idx !== activePlayerIndex && hp > 0)
      if (playerHPs.some(hp => hp > 0)) {
        const idx = playerHPs.findIndex(hp => hp > 0)
        setActivePlayerIndex(idx)
        pushLog(`You send out ${playerTeams[idx].name}!`)
      } else {
        pushLog('All your Pokémon fainted. You lose.')
        setMessage('You lost — try again.')
      }
    }
  }

  // reset HPs only
  const resetHPs = () => {
    setPlayerHPs(playerTeams.map(p => Math.max(1, Math.round((p.stats.hp || 50) * DEFAULT_HP_SCALE))))
    setAiHPs(aiTeams.map(a => Math.max(1, Math.round((a.stats.hp || 50) * DEFAULT_HP_SCALE))))
    setLog([])
    setMessage('HP restored')
  }

  // quick helpers for UI
  const activePlayer = playerTeams[activePlayerIndex]
  const activeAi = aiTeams[activeAiIndex]
  const activePlayerMoves = activePlayer ? (playerMoves[activePlayer.name] || []) : []
  const activeAiMoves = activeAi ? (aiMoves[activeAi.name] || []) : []

  // autocomplete selection handler
  const addPlayerByName = (name) => {
    if (!name) return
    setQuery('')
    setSuggestions([])
    // append to teams (replace first empty slot)
    setPlayerTeams(prev => {
      const copy = prev.slice()
      if (copy.length < TEAM_SIZE) {
        // fetch and append later via startBattle flow or fetch here
        return copy.concat([]) // no op here: better use startBattle to build full teams
      }
      return copy
    })
  }

  // helper UI: show move label (prefer real name)
  const moveLabel = (m) => `${(m?.name || 'Move').replace('-', ' ')} ${m?.power ? `(${m.power})` : ''}`

  // UI render
  return (
    <div className="p-6">
      <style>{styles}</style>
      <h1 className="text-2xl font-bold mb-4">Battle Arena (Single-player vs AI)</h1>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          {/* Team chooser + start */}
          <div className="mb-3 p-3 border rounded bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="w-full">
                <label className="text-sm text-gray-600 dark:text-gray-300">Choose up to {TEAM_SIZE} Pokémon (autocomplete)</label>
                <input
                  className="w-full input mt-1 px-3 py-2 border rounded"
                  placeholder="Type a name (e.g. pikachu), select suggestion, press Add — or click Quick Start"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {suggestions.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border rounded mt-1 max-h-44 overflow-auto z-50">
                    {suggestions.map(s => (
                      <div key={s} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setQuery(s)}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="px-3 py-2 rounded bg-green-600 text-white"
                onClick={() => {
                  if (!query) return
                  // start battle with this name in first slot, others random
                  startBattle([query])
                }}
                disabled={loadingBattle}
              >
                Add & Start
              </button>

              <button
                className="px-3 py-2 rounded border"
                onClick={() => startBattle([])}
                disabled={loadingBattle}
              >
                Quick Start (Random Teams)
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Tip: autocomplete is debounced. Pick names exactly or use Quick Start for random fun.
            </div>
          </div>

          {/* battlefield */}
          <div className="rounded-lg border p-4 bg-white dark:bg-gray-900 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Player side */}
              <div className="text-center">
                <h3 className="font-semibold">Your Team</h3>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {playerTeams.length === 0 && <div className="col-span-3 text-sm text-gray-500">No team yet — use Quick Start or add a Pokémon</div>}
                  {playerTeams.map((p, idx) => {
                    const hp = playerHPs[idx] ?? 0
                    const faintClass = hp <= 0 ? 'battle-faint' : ''
                    const activeClass = idx === activePlayerIndex ? 'ring-2 ring-indigo-400' : ''
                    return (
                      <div key={p.name} className={`p-2 rounded border bg-white dark:bg-gray-800 ${activeClass}`}>
                        <div className="flex flex-col items-center">
                          {p.sprite ? <img src={p.sprite} alt={p.name} className={`w-20 h-20 object-contain ${faintClass}`} /> : <div className="w-20 h-20 bg-gray-100 rounded" />}
                          <p className="capitalize mt-1 text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">HP: {hp}</p>
                          <div className="mt-1 w-full bg-gray-200 h-2 rounded overflow-hidden">
                            <div className="h-2 bg-green-500 transition-all" style={{ width: `${clamp((hp / Math.max(1, Math.round((p.stats.hp||50)*DEFAULT_HP_SCALE))) * 100, 0, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4">
                  <h4 className="font-semibold">Active: {activePlayer?.name || '—'}</h4>
                  <div className="mt-2 flex flex-col md:flex-row gap-2">
                    {activePlayerMoves.map((m, idx) => (
                      <button
                        key={m.name + idx}
                        onClick={() => playerUseMoveIndex(idx)}
                        disabled={busy || (playerHPs[activePlayerIndex] ?? 0) <= 0 || (aiHPs[activeAiIndex] ?? 0) <= 0}
                        className="px-3 py-2 rounded border bg-gray-50 hover:bg-gray-100 text-sm"
                      >
                        {moveLabel(m)}
                        <div className="text-xs text-gray-400">{m.type}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI side */}
              <div className="text-center">
                <h3 className="font-semibold">AI Team</h3>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {aiTeams.length === 0 && <div className="col-span-3 text-sm text-gray-500">No AI team — Quick Start to generate</div>}
                  {aiTeams.map((p, idx) => {
                    const hp = aiHPs[idx] ?? 0
                    const faintClass = hp <= 0 ? 'battle-faint' : ''
                    const activeClass = idx === activeAiIndex ? 'ring-2 ring-red-400' : ''
                    return (
                      <div key={p.name} className={`p-2 rounded border bg-white dark:bg-gray-800 ${activeClass}`}>
                        <div className="flex flex-col items-center">
                          {p.sprite ? <img src={p.sprite} alt={p.name} className={`w-20 h-20 object-contain ${faintClass}`} /> : <div className="w-20 h-20 bg-gray-100 rounded" />}
                          <p className="capitalize mt-1 text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">HP: {hp}</p>
                          <div className="mt-1 w-full bg-gray-200 h-2 rounded overflow-hidden">
                            <div className="h-2 bg-red-500 transition-all" style={{ width: `${clamp((hp / Math.max(1, Math.round((p.stats.hp||50)*DEFAULT_HP_SCALE))) * 100, 0, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4">
                  <h4 className="font-semibold">AI Active: {activeAi?.name || '—'}</h4>
                  <div className="mt-2 text-sm text-gray-500">
                    AI moves are chosen automatically.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => resetHPs()} className="px-3 py-2 rounded border">Reset HP</button>
              <button onClick={() => startBattle([])} className="px-3 py-2 rounded bg-blue-600 text-white">Randomize Teams</button>
              <button onClick={() => setLog([])} className="px-3 py-2 rounded border">Clear Log</button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600">Status: {message || 'Waiting...'}</p>
            </div>
          </div>
        </div>

        {/* right column: log */}
        <div className="col-span-1">
          <div className="rounded-lg border p-3 h-full bg-gray-50 dark:bg-gray-800">
            <h4 className="font-semibold mb-2">Battle Log</h4>
            <div className="space-y-2 max-h-72 overflow-auto">
              {log.length === 0 && <p className="text-sm text-gray-500">Actions will appear here.</p>}
              {log.map((l, idx) => (
                <div key={idx} className="text-sm bg-white dark:bg-gray-900 p-2 rounded shadow-sm">
                  {l}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button onClick={() => setLog([])} className="px-3 py-1 rounded border text-sm">Clear Log</button>
              <button onClick={() => startBattle([])} className="ml-2 px-3 py-1 rounded bg-blue-600 text-white text-sm">Randomize Opponent</button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>Damage uses attack/defense, move power, type multipliers, randomness, and critical hits. Moves are fetched from PokéAPI when available and cached.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BattleArena
