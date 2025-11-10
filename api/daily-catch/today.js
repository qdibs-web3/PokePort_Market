// api/daily-catch/today.js
const connectToDatabase = require('../_lib/mongodb');
const User = require('../_models/User');

// Simple hash function to generate deterministic random number from string
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Get wallet address from query params
    const wallet_address = req.query.wallet_address;

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Find user to get their last catch time
    const user = await User.findOne({ walletAddress: wallet_address.toLowerCase() });

    // Calculate current hour slot (changes every hour)
    const now = new Date();
    const currentHourSlot = Math.floor(now.getTime() / (1000 * 60 * 60)); // Hour-based slot

    // Create unique seed per user per hour slot
    // This ensures each user gets a different Pokemon, and it changes every hour
    const seed = `${wallet_address.toLowerCase()}-${currentHourSlot}`;
    const hash = hashString(seed);
    
    // Generate Pokemon ID (1-151 for Gen 1)
    const pokemonId = (hash % 151) + 1;

    console.log('Generating Pokemon for user:', wallet_address);
    console.log('Hour slot:', currentHourSlot);
    console.log('Seed:', seed);
    console.log('Pokemon ID:', pokemonId);

    // Fetch Pokemon data from PokeAPI
    const pokeResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    
    if (!pokeResponse.ok) {
      throw new Error('Failed to fetch Pokemon from PokeAPI');
    }

    const pokeData = await pokeResponse.json();

    // Check if user can catch (1 hour since last catch)
    let canCatch = true;
    let timeUntilNext = 0;

    if (user && user.lastDailyCatch) {
      const lastCatch = new Date(user.lastDailyCatch);
      const timeSinceLastCatch = now - lastCatch;
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      if (timeSinceLastCatch < oneHour) {
        canCatch = false;
        timeUntilNext = oneHour - timeSinceLastCatch;
      }
    }

    return res.status(200).json({
      pokemonId: pokeData.id,
      pokemonName: pokeData.name,
      sprite: pokeData.sprites.other['official-artwork'].front_default || pokeData.sprites.front_default,
      types: pokeData.types.map(t => t.type.name),
      stats: {
        hp: pokeData.stats[0].base_stat,
        attack: pokeData.stats[1].base_stat,
        defense: pokeData.stats[2].base_stat,
        'special-attack': pokeData.stats[3].base_stat,
        'special-defense': pokeData.stats[4].base_stat,
        speed: pokeData.stats[5].base_stat
      },
      canCatch,
      timeUntilNext,
      lastCatch: user?.lastDailyCatch || null
    });
  } catch (error) {
    console.error('Error fetching daily Pokemon:', error);
    return res.status(500).json({ error: 'Failed to fetch daily Pokemon' });
  }
};