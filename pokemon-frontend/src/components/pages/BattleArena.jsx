// src/pages/BattleArena.jsx
import React, { useEffect, useState, useRef } from 'react'

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))
const DEFAULT_HP_SCALE = 2.0
const CRIT_CHANCE = 0.0625
const CRIT_MULT = 1.5

const styles = `
/* Enhanced Animations */
@keyframes attackSlide {
  0% { transform: translateX(0) scale(1); }
  30% { transform: translateX(40px) scale(1.1); }
  50% { transform: translateX(40px) scale(1.15) rotate(5deg); }
  70% { transform: translateX(0) scale(1.05); }
  100% { transform: translateX(0) scale(1); }
}

@keyframes attackSlideLeft {
  0% { transform: translateX(0) scale(1); }
  30% { transform: translateX(-40px) scale(1.1); }
  50% { transform: translateX(-40px) scale(1.15) rotate(-5deg); }
  70% { transform: translateX(0) scale(1.05); }
  100% { transform: translateX(0) scale(1); }
}

@keyframes hitShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

@keyframes damageFlash {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(2) hue-rotate(20deg); }
}

@keyframes criticalFlash {
  0%, 100% { filter: brightness(1); }
  25% { filter: brightness(2.5) saturate(2); }
  50% { filter: brightness(1.5) saturate(1.5); }
  75% { filter: brightness(2.5) saturate(2); }
}

@keyframes floatDamage {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  10% { opacity: 1; }
  50% { transform: translateY(-60px) scale(1.2); opacity: 1; }
  100% { transform: translateY(-120px) scale(0.8); opacity: 0; }
}

@keyframes missFloat {
  0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-80px) translateX(30px) scale(1); opacity: 0; }
}

@keyframes victoryBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-30px) scale(1.1); }
  50% { transform: translateY(-15px) scale(1.05); }
  75% { transform: translateY(-25px) scale(1.08); }
}

@keyframes defeatFade {
  0% { transform: scale(1) rotate(0deg); opacity: 1; }
  100% { transform: scale(0.7) rotate(-15deg); opacity: 0.2; }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.9), 0 0 40px rgba(59, 130, 246, 0.6); }
}

@keyframes slideInUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes backgroundShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
}

.battle-attack { animation: attackSlide 0.6s ease-out; }
.battle-attack-left { animation: attackSlideLeft 0.6s ease-out; }
.battle-hit { animation: hitShake 0.4s ease, damageFlash 0.3s ease; }
.battle-critical { animation: hitShake 0.5s ease, criticalFlash 0.5s ease; }
.battle-faint { animation: defeatFade 0.8s ease forwards; }
.battle-victory { animation: victoryBounce 0.8s ease infinite; }
.battle-card { transition: all 0.3s ease; }
.battle-card:hover { transform: translateY(-4px) scale(1.02); }
.battle-glow { animation: pulseGlow 2s ease-in-out infinite; }
.slide-in { animation: slideInUp 0.4s ease-out; }

.damage-number {
  position: absolute;
  font-weight: bold;
  font-size: 2rem;
  pointer-events: none;
  z-index: 100;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  animation: floatDamage 1.2s ease-out forwards;
}

.damage-critical {
  font-size: 2.5rem;
  color: #ff0;
  text-shadow: 0 0 10px #ff0, 2px 2px 4px rgba(0,0,0,0.9);
}

.damage-normal { color: #fff; }
.damage-super { color: #4ade80; }
.damage-weak { color: #94a3b8; }

.miss-text {
  position: absolute;
  font-weight: bold;
  font-size: 1.5rem;
  color: #94a3b8;
  pointer-events: none;
  z-index: 100;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.6);
  animation: missFloat 1s ease-out forwards;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  animation: sparkle 0.6s ease-out forwards;
}

.animated-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%);
  background-size: 400% 400%;
  animation: backgroundShift 15s ease infinite;
}

.type-badge {
  background: linear-gradient(135deg, var(--type-color-1), var(--type-color-2));
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.type-badge:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.hp-bar-container {
  position: relative;
  overflow: visible;
}

.hp-bar-glow {
  position: absolute;
  top: -2px;
  left: 0;
  height: calc(100% + 4px);
  background: inherit;
  filter: blur(8px);
  opacity: 0.6;
  transition: width 0.5s ease;
}

.move-button {
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.move-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.move-button:active::before {
  width: 300px;
  height: 300px;
}

.battle-modal {
  animation: slideInUp 0.5s ease-out;
}

@media (max-width: 768px) {
  .damage-number { font-size: 1.5rem; }
  .damage-critical { font-size: 2rem; }
  .miss-text { font-size: 1.2rem; }
}
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

async function safeFetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch failed: ${url}`)
  return res.json()
}

async function fetchPokemonFull(nameOrId) {
  const key = `poke:pokemon:${nameOrId}`
  const cached = getSessionCache(key)
  if (cached) return cached
  const json = await safeFetchJson(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(String(nameOrId).toLowerCase())}`)
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

async function fetchTypeRelations(typeName) {
  const key = `poke:type:${typeName}`
  const cached = getSessionCache(key)
  if (cached) return cached
  const json = await safeFetchJson(`https://pokeapi.co/api/v2/type/${typeName}`)
  const map = {}
  ;(json.damage_relations?.double_damage_to || []).forEach(t => (map[t.name] = 2))
  ;(json.damage_relations?.half_damage_to || []).forEach(t => (map[t.name] = 0.5))
  ;(json.damage_relations?.no_damage_to || []).forEach(t => (map[t.name] = 0))
  setSessionCache(key, map)
  return map
}

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
    } catch {}
  }
  while (moves.length < limit) {
    moves.push({ name: 'Tackle', power: 40, type: pokemon.types[0] || 'normal', accuracy: 100 })
  }
  setSessionCache(key, moves)
  return moves
}

async function computeDamageDetailed(attacker, defender, move) {
  const atk = Math.max(1, attacker.stats.attack || attacker.stats['special-attack'] || 50)
  const def = Math.max(1, defender.stats.defense || defender.stats['special-defense'] || 50)
  const movePower = Math.max(1, move.power || 40)

  const accuracy = move.accuracy || 100
  const hitRoll = Math.random() * 100
  const missed = hitRoll > accuracy

  if (missed) {
    return { damage: 0, typeMult: 1, isCrit: false, missed: true }
  }

  const base = (atk / def) * movePower * 0.5
  const randomFactor = 0.85 + Math.random() * 0.3

  let typeMult = 1
  try {
    const relations = await fetchTypeRelations(move.type)
    for (const dt of defender.types) {
      const mult = relations[dt] ?? 1
      typeMult *= mult
    }
  } catch (e) {}

  const isCrit = Math.random() < CRIT_CHANCE
  const critMult = isCrit ? CRIT_MULT : 1

  const damage = Math.max(1, Math.round(base * randomFactor * typeMult * critMult))
  return { damage, typeMult, isCrit, missed: false }
}

async function fetchPokemonNameList() {
  const key = 'poke:nameList:v1'
  const cached = getSessionCache(key)
  if (cached) return cached
  const json = await safeFetchJson('https://pokeapi.co/api/v2/pokemon?limit=2000')
  const names = json.results.map(r => r.name)
  setSessionCache(key, names)
  return names
}

function getEffectivenessMessage(mult) {
  if (mult === 0) return "no effect"
  if (mult >= 4) return "devastatingly effective"
  if (mult >= 2) return "super effective"
  if (mult <= 0.25) return "barely effective"
  if (mult <= 0.5) return "not very effective"
  return ""
}

function formatMoveName(name) {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function getTypeColors(type) {
  const colors = {
    normal: ['#A8A878', '#C6C6A7'],
    fire: ['#F08030', '#F5AC78'],
    water: ['#6890F0', '#9DB7F5'],
    electric: ['#F8D030', '#FAE078'],
    grass: ['#78C850', '#A7DB8D'],
    ice: ['#98D8D8', '#BCE6E6'],
    fighting: ['#C03028', '#D67873'],
    poison: ['#A040A0', '#C183C1'],
    ground: ['#E0C068', '#EBD69D'],
    flying: ['#A890F0', '#C6B7F5'],
    psychic: ['#F85888', '#FA92B2'],
    bug: ['#A8B820', '#C6D16E'],
    rock: ['#B8A038', '#D1C17D'],
    ghost: ['#705898', '#A292BC'],
    dragon: ['#7038F8', '#A27DFA'],
    dark: ['#705848', '#A29288'],
    steel: ['#B8B8D0', '#D1D1E0'],
    fairy: ['#EE99AC', '#F4BDC9'],
  }
  return colors[type] || ['#A8A878', '#C6C6A7']
}

const BattleArena = () => {
  const [pokemonList, setPokemonList] = useState([])
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [playerPokemon, setPlayerPokemon] = useState(null)
  const [selectedPokemon, setSelectedPokemon] = useState(null)
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
  const [loadingBattle, setLoadingBattle] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [playerAnimation, setPlayerAnimation] = useState('')
  const [aiAnimation, setAiAnimation] = useState('')
  const [damageNumbers, setDamageNumbers] = useState([])
  const [particles, setParticles] = useState([])
  const [battleResult, setBattleResult] = useState(null)
  const [hoveredMove, setHoveredMove] = useState(null)
  
  const mountedRef = useRef(true)
  const playerRef = useRef(null)
  const aiRef = useRef(null)
  const damageIdRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => (mountedRef.current = false)
  }, [])

  useEffect(() => {
    fetchPokemonNameList().then(list => {
      if (!mountedRef.current) return
      setPokemonList(list)
    }).catch(() => {})
  }, [])

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

  const pushLog = (entry) => {
    setLog(prev => [entry, ...prev].slice(0, 50))
  }

  const showDamageNumber = (damage, isCrit, typeMult, isPlayer) => {
    const id = damageIdRef.current++
    const ref = isPlayer ? aiRef : playerRef
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    let className = 'damage-normal'
    if (isCrit) className = 'damage-critical'
    else if (typeMult >= 2) className = 'damage-super'
    else if (typeMult <= 0.5) className = 'damage-weak'

    setDamageNumbers(prev => [...prev, { id, damage, className, x, y }])
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id))
    }, 1200)
  }

  const showMissText = (isPlayer) => {
    const id = damageIdRef.current++
    const ref = isPlayer ? aiRef : playerRef
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    setDamageNumbers(prev => [...prev, { id, miss: true, x, y }])
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id))
    }, 1000)
  }

  const createParticles = (isPlayer, isCrit) => {
    const ref = isPlayer ? aiRef : playerRef
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const count = isCrit ? 20 : 10
    const newParticles = []

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const distance = 30 + Math.random() * 30
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance
      const color = isCrit ? '#fbbf24' : '#60a5fa'
      const id = damageIdRef.current++

      newParticles.push({ id, x, y, color })
    }

    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 600)
  }

  const pickRandomBasic = async () => {
    const max = 898
    const id = Math.floor(Math.random() * max) + 1
    return fetchPokemonFull(id)
  }

  const startBattle = async (playerName = null) => {
    setLoadingBattle(true)
    setLog([])
    setMessage('')
    setTurnCount(0)
    setBattleActive(false)
    setBattleResult(null)
    setPlayerAnimation('')
    setAiAnimation('')
    setDamageNumbers([])
    setParticles([])
    
    try {
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

      const ai = await pickRandomBasic()
      const pMoves = await selectMovesForPokemon(player, 4)
      const aMoves = await selectMovesForPokemon(ai, 4)

      const pMaxHP = Math.max(1, Math.round((player.stats.hp || 50) * DEFAULT_HP_SCALE))
      let aMaxHP = Math.max(1, Math.round((ai.stats.hp || 50) * DEFAULT_HP_SCALE))
      
      // Balance AI HP to be within 30 HP of player's HP for fairness
      const hpDifference = Math.abs(aMaxHP - pMaxHP)
      if (hpDifference > 30) {
        // Adjust AI HP to be within 30 HP range
        if (aMaxHP > pMaxHP) {
          aMaxHP = pMaxHP + 30
        } else {
          aMaxHP = Math.max(1, pMaxHP - 30)
        }
      }

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
      
      pushLog(`⚔️ Battle Started!`)
      pushLog(`👤 ${player.name.toUpperCase()} vs 🤖 ${ai.name.toUpperCase()}`)
      setMessage('Battle Started! Choose your move!')
    } catch (err) {
      console.error(err)
      pushLog('❌ Failed to start battle. Try again.')
      setMessage('Error starting battle.')
    } finally {
      if (mountedRef.current) setLoadingBattle(false)
    }
  }

  const playerUseMoveIndex = async (moveIdx) => {
    if (busy || !battleActive) return
    if (!playerPokemon || !aiPokemon) return
    if (playerHP <= 0 || aiHP <= 0) return

    setBusy(true)
    const currentTurn = turnCount + 1
    setTurnCount(currentTurn)

    const move = playerMoves[moveIdx] || playerMoves[0]
    const mv = { 
      name: move.name, 
      power: move.power || 40, 
      type: move.type || playerPokemon.types[0] || 'normal', 
      accuracy: move.accuracy || 100 
    }

    pushLog(`\n🔷 Turn ${currentTurn}`)

    const playerSpeed = playerPokemon.stats.speed || 50
    const aiSpeed = aiPokemon.stats.speed || 50
    const playerFirst = playerSpeed >= aiSpeed

    if (playerFirst) {
      await executePlayerTurn(mv, currentTurn)
      if (aiHP > 0 && battleActive) {
        await new Promise(r => setTimeout(r, 1000))
        await executeAiTurn(currentTurn)
      }
    } else {
      await executeAiTurn(currentTurn)
      if (playerHP > 0 && battleActive) {
        await new Promise(r => setTimeout(r, 1000))
        await executePlayerTurn(mv, currentTurn)
      }
    }

    setBusy(false)
  }

  const executePlayerTurn = async (mv, turn) => {
    if (!battleActive || playerHP <= 0 || aiHP <= 0) return

    const moveName = formatMoveName(mv.name)
    pushLog(`👤 ${playerPokemon.name} used ${moveName}!`)

    // Trigger attack animation
    setPlayerAnimation('battle-attack')
    setTimeout(() => setPlayerAnimation(''), 600)

    await new Promise(r => setTimeout(r, 300))

    const { damage, typeMult, isCrit, missed } = await computeDamageDetailed(playerPokemon, aiPokemon, mv)

    if (missed) {
      pushLog(`💨 Missed!`)
      setMessage(`${playerPokemon.name}'s attack missed!`)
      showMissText(true)
      return
    }

    // Trigger hit animation
    setAiAnimation(isCrit ? 'battle-critical' : 'battle-hit')
    setTimeout(() => setAiAnimation(''), isCrit ? 500 : 400)

    const newAiHP = Math.max(0, aiHP - damage)
    setAiHP(newAiHP)

    showDamageNumber(damage, isCrit, typeMult, true)
    createParticles(true, isCrit)

    const effectiveness = getEffectivenessMessage(typeMult)
    const critText = isCrit ? ' 💥 CRITICAL!' : ''
    const effectText = effectiveness ? ` (${effectiveness})` : ''
    
    pushLog(`💥 ${damage} damage!${critText}${effectText}`)
    setMessage(`${playerPokemon.name} dealt ${damage} damage!${critText}`)

    await new Promise(r => setTimeout(r, 500))

    if (newAiHP <= 0) {
      setAiAnimation('battle-faint')
      pushLog(`💀 ${aiPokemon.name} fainted!`)
      pushLog(`🎉 VICTORY! You won in ${turn} turns!`)
      setMessage('🎉 You win!')
      setBattleActive(false)
      setBattleResult({ victory: true, turns: turn })
      setPlayerAnimation('battle-victory')
    }
  }

  const executeAiTurn = async (turn) => {
    if (!battleActive || aiHP <= 0 || playerHP <= 0) return

    const choice = aiMoves[Math.floor(Math.random() * aiMoves.length)] || { 
      name: 'Tackle', 
      power: 40, 
      type: aiPokemon.types[0] || 'normal', 
      accuracy: 100 
    }
    const mv = { 
      name: choice.name, 
      power: choice.power || 40, 
      type: choice.type || aiPokemon.types[0] || 'normal', 
      accuracy: choice.accuracy || 100 
    }

    const moveName = formatMoveName(mv.name)
    pushLog(`🤖 ${aiPokemon.name} used ${moveName}!`)

    // Trigger attack animation
    setAiAnimation('battle-attack-left')
    setTimeout(() => setAiAnimation(''), 600)

    await new Promise(r => setTimeout(r, 300))

    const { damage, typeMult, isCrit, missed } = await computeDamageDetailed(aiPokemon, playerPokemon, mv)

    if (missed) {
      pushLog(`💨 Missed!`)
      setMessage(`${aiPokemon.name}'s attack missed!`)
      showMissText(false)
      return
    }

    // Trigger hit animation
    setPlayerAnimation(isCrit ? 'battle-critical' : 'battle-hit')
    setTimeout(() => setPlayerAnimation(''), isCrit ? 500 : 400)

    const newPlayerHP = Math.max(0, playerHP - damage)
    setPlayerHP(newPlayerHP)

    showDamageNumber(damage, isCrit, typeMult, false)
    createParticles(false, isCrit)

    const effectiveness = getEffectivenessMessage(typeMult)
    const critText = isCrit ? ' 💥 CRITICAL!' : ''
    const effectText = effectiveness ? ` (${effectiveness})` : ''
    
    pushLog(`💥 ${damage} damage!${critText}${effectText}`)
    setMessage(`${aiPokemon.name} dealt ${damage} damage!${critText}`)

    await new Promise(r => setTimeout(r, 500))

    if (newPlayerHP <= 0) {
      setPlayerAnimation('battle-faint')
      pushLog(`💀 ${playerPokemon.name} fainted!`)
      pushLog(`😢 DEFEAT! You lost in ${turn} turns.`)
      setMessage('You lost — try again!')
      setBattleActive(false)
      setBattleResult({ victory: false, turns: turn })
    }
  }

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

  const getMoveEffectiveness = async (move, defender) => {
    if (!move || !defender) return 1
    try {
      const relations = await fetchTypeRelations(move.type)
      let mult = 1
      for (const dt of defender.types) {
        mult *= relations[dt] ?? 1
      }
      return mult
    } catch {
      return 1
    }
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6">
      <style>{styles}</style>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
        <h1 className="p-3 text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-yellow-400 bg-clip-text text-transparent mb-2">
          Pokémon Battle Arena
        </h1>
        <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Epic 1v1 Turn-Based Combat
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto">
        {/* Setup Section */}
        <div className="mb-4 p-3 sm:p-4 rounded-xl bg-white dark:bg-gray-900 shadow-lg border-2 border-yellow-200 dark:border-blue-900 slide-in">
          <h3 className="font-bold text-base sm:text-lg mb-3 text-black-900">
            Choose Your Pokémon
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1">
              {selectedPokemon && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-sm font-semibold shadow-md">
                  <span className="capitalize">{selectedPokemon}</span>
                  <button
                    type="button"
                    className="hover:scale-125 transition-transform"
                    onClick={() => setSelectedPokemon(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              <input
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-900 bg-white dark:bg-gray-800 text-sm sm:text-base transition-all"
                placeholder="Search Pokémon (e.g., pikachu)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loadingBattle}
              />

              {suggestions.length > 0 && (
                <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-auto">
                  {suggestions.map(s => (
                    <div 
                      key={s} 
                      className={`px-4 py-2 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white cursor-pointer capitalize transition-all ${
                        s === selectedPokemon ? "bg-blue-100 dark:bg-blue-900" : ""
                      }`}
                      onClick={() => {
                        setSelectedPokemon(s)
                        setQuery("")
                        setSuggestions([])
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg text-sm sm:text-base"
              onClick={() => {
                if (!selectedPokemon) return
                startBattle(selectedPokemon)
              }}
              disabled={loadingBattle || !selectedPokemon}
            >
              {loadingBattle ? ' Loading...' : ' Start Battle'}
            </button>

            <button
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg border-3 border-yellow-200 dark:border-blue-900 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-800 hover:text-white hover:border-transparent font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base"
              onClick={() => startBattle(null)}
              disabled={loadingBattle}
            >
               Random
            </button>
          </div>
        </div>

        {/* Battle Arena */}
        <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-yellow-200 dark:border-blue-900 mb-2">
          {/* Battle Container - Gradient removed */}
          <div className="bg-transparent dark:bg-gray-800 p-4 sm:p-6 md:p-8">
            {/* Status Message - Prominent */}
            <div className="mb-4 p-3 sm:p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-lg text-center border-2 border-yellow-200 dark:border-blue-900">
              <p className="font-bold text-base sm:text-lg md:text-xl text-gray-900 dark:text-gray-100">
                {message || 'Waiting for battle to start...'}
              </p>
              {battleActive && (
                <p className="text-large sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Turn {turnCount}
                </p>
              )}
            </div>

            {/* Battle Field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center relative">
              {/* Player Side */}
              <div className="text-center">
                <h3 className="font-bold text-sm sm:text-base md:text-lg mb-3 text-yellow drop-shadow-lg">
                  👤 YOUR POKÉMON
                </h3>
                {!playerPokemon ? (
                  <div className="p-6 sm:p-8 rounded-xl border-2 border-dashed border-white/50 bg-white/20 backdrop-blur-sm">
                    <p className="text-black text-sm sm:text-base">Choose a Pokémon!</p>
                  </div>
                ) : (
                  <div 
                    ref={playerRef}
                    className={`battle-card p-4 sm:p-6 rounded-2xl border-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl ${
                      playerHP <= 0 ? 'border-gray-400' : 'border-blue-500 battle-glow'
                    } ${playerAnimation}`}
                  >
                    <div className="flex flex-col items-center">
                      {playerPokemon.sprite ? (
                        <img 
                          src={playerPokemon.sprite} 
                          alt={playerPokemon.name} 
                          className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl" 
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gray-200 rounded-lg" />
                      )}
                      <p className="capitalize mt-2 sm:mt-3 text-lg sm:text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 drop-shadow">
                        {playerPokemon.name}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap justify-center">
                        {playerPokemon.types.map(t => {
                          const [c1, c2] = getTypeColors(t)
                          return (
                            <span 
                              key={t} 
                              className="type-badge px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
                              style={{ '--type-color-1': c1, '--type-color-2': c2 }}
                            >
                              {t}
                            </span>
                          )
                        })}
                      </div>
                      <p className="text-base sm:text-lg font-bold mt-2 sm:mt-3 text-gray-900 dark:text-gray-100">
                        HP: {playerHP}/{playerMaxHP}
                      </p>
                      <div className="hp-bar-container mt-2 w-full bg-gray-300 dark:bg-gray-700 h-3 sm:h-4 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-500 ${getHPColor(getHPPercentage(playerHP, playerMaxHP))} relative`}
                          style={{ width: `${getHPPercentage(playerHP, playerMaxHP)}%` }} 
                        >
                          <div 
                            className="hp-bar-glow"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                        ⚡ Speed: {playerPokemon.stats.speed || 50}
                      </p>
                    </div>
                  </div>
                )}

                {/* Moves - Mobile Optimized */}
                {playerPokemon && battleActive && playerHP > 0 && aiHP > 0 && (
                  <div className="mt-4">
                    <h4 className="font-bold text-sm sm:text-base mb-2 text-black drop-shadow">
                      Choose Your Move:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {playerMoves.map((m, idx) => {
                        const [c1, c2] = getTypeColors(m.type)
                        return (
                          <button
                            key={m.name + idx}
                            onClick={() => playerUseMoveIndex(idx)}
                            onMouseEnter={() => setHoveredMove(m)}
                            onMouseLeave={() => setHoveredMove(null)}
                            disabled={busy}
                            className="move-button px-3 py-2 sm:py-3 rounded-lg border-2 bg-white dark:bg-gray-800 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                            style={{ 
                              borderColor: c1,
                              background: `linear-gradient(135deg, ${c1}22, ${c2}22)`
                            }}
                          >
                            <div className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                              {formatMoveName(m.name)}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 capitalize mt-1">
                              ⚡{m.power || '?'} • {m.type}
                            </div>
                            {m.accuracy && m.accuracy < 100 && (
                              <div className="text-xs text-orange-600 font-semibold mt-1">
                                {m.accuracy}% acc
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Side */}
              <div className="text-center">
                <h3 className="font-bold text-sm sm:text-base md:text-lg mb-3 text-yellow drop-shadow-lg">
                  🤖 OPPONENT
                </h3>
                {!aiPokemon ? (
                  <div className="p-6 sm:p-8 rounded-xl border-2 border-dashed border-white/50 bg-white/20 backdrop-blur-sm">
                    <p className="text-black text-sm sm:text-base">Waiting...</p>
                  </div>
                ) : (
                  <div 
                    ref={aiRef}
                    className={`battle-card p-4 sm:p-6 rounded-2xl border-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-2xl ${
                      aiHP <= 0 ? 'border-gray-400' : 'border-red-500 battle-glow'
                    } ${aiAnimation}`}
                  >
                    <div className="flex flex-col items-center">
                      {aiPokemon.sprite ? (
                        <img 
                          src={aiPokemon.sprite} 
                          alt={aiPokemon.name} 
                          className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl" 
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gray-200 rounded-lg" />
                      )}
                      <p className="capitalize mt-2 sm:mt-3 text-lg sm:text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 drop-shadow">
                        {aiPokemon.name}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap justify-center">
                        {aiPokemon.types.map(t => {
                          const [c1, c2] = getTypeColors(t)
                          return (
                            <span 
                              key={t} 
                              className="type-badge px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
                              style={{ '--type-color-1': c1, '--type-color-2': c2 }}
                            >
                              {t}
                            </span>
                          )
                        })}
                      </div>
                      <p className="text-base sm:text-lg font-bold mt-2 sm:mt-3 text-gray-900 dark:text-gray-100">
                        HP: {aiHP}/{aiMaxHP}
                      </p>
                      <div className="hp-bar-container mt-2 w-full bg-gray-300 dark:bg-gray-700 h-3 sm:h-4 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-500 ${getHPColor(getHPPercentage(aiHP, aiMaxHP))} relative`}
                          style={{ width: `${getHPPercentage(aiHP, aiMaxHP)}%` }} 
                        >
                          <div 
                            className="hp-bar-glow"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                        ⚡ Speed: {aiPokemon.stats.speed || 50}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* VS Badge - Responsive */}
              {playerPokemon && aiPokemon && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
                  <div className="bg-gradient-to-br from-red-600 to-orange-600 text-white font-black text-xl sm:text-2xl md:text-3xl px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl border-4 border-white animate-pulse">
                    VS
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Battle Log - Collapsible on Mobile */}
        <div className="rounded-xl bg-white dark:bg-gray-900 shadow-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setShowLog(!showLog)}
            className="w-full px-4 py-3 flex items-center justify-between font-bold text-sm sm:text-base bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all"
          >
            <span className="flex items-center gap-2">
              📜 Battle Log
              {turnCount > 0 && (
                <span className="text-xs sm:text-sm font-normal text-gray-600 dark:text-gray-400">
                  (Turn {turnCount})
                </span>
              )}
            </span>
            <span className="text-xl">{showLog ? '▼' : '▶'}</span>
          </button>
          
          {showLog && (
            <div className="p-4 max-h-64 sm:max-h-80 overflow-auto bg-gray-50 dark:bg-gray-900">
              {log.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center">
                  Battle logs will appear here...
                </p>
              ) : (
                <div className="space-y-1 font-mono text-xs sm:text-sm">
                  {log.map((l, idx) => (
                    <div 
                      key={idx} 
                      className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Damage Numbers */}
      {damageNumbers.map(dn => (
        dn.miss ? (
          <div
            key={dn.id}
            className="miss-text fixed"
            style={{ left: dn.x, top: dn.y }}
          >
            MISS
          </div>
        ) : (
          <div
            key={dn.id}
            className={`damage-number fixed ${dn.className}`}
            style={{ left: dn.x, top: dn.y }}
          >
            -{dn.damage}
          </div>
        )
      ))}

      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="particle fixed"
          style={{ 
            left: p.x, 
            top: p.y,
            backgroundColor: p.color
          }}
        />
      ))}

      {/* Battle Result Modal */}
      {battleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="battle-modal bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border-4 border-yellow-200 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setBattleResult(null)
                setPlayerAnimation('')
                setAiAnimation('')
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Close"
            >
              <span className="text-gray-600 dark:text-gray-300 text-xl font-bold leading-none">×</span>
            </button>
            <div className="text-center">
              <div className="text-5xl sm:text-6xl mb-4">
                {battleResult.victory ? '🎉' : '😢'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-4 bg-gradient-to-r from-yellow-200 via-orange-500 to-red-500 bg-clip-text text-transparent">
                {battleResult.victory ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-6">
                Battle ended in <span className="font-bold text-purple-600">{battleResult.turns}</span> turns
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setBattleResult(null)
                    setPlayerAnimation('')
                    setAiAnimation('')
                  }}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  ⚔️ New Battle
                </button>
                <button
                  onClick={() => startBattle(selectedPokemon)}
                  className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold transition-all transform hover:scale-105 active:scale-95"
                >
                  🔄 Rematch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BattleArena