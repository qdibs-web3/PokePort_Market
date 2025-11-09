// api/pokedex/[wallet_address].js
const connectToDatabase = require('../_lib/mongodb');
const User = require('../_models/User');

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

    const { wallet_address } = req.query;

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Find user
    const user = await User.findOne({ walletAddress: wallet_address.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get unique Pokemon IDs (for Pokedex display)
    const uniquePokemon = {};
    user.caughtPokemon.forEach(pokemon => {
      if (!uniquePokemon[pokemon.pokemonId]) {
        uniquePokemon[pokemon.pokemonId] = {
          pokemonId: pokemon.pokemonId,
          pokemonName: pokemon.pokemonName,
          sprite: pokemon.sprite,
          firstCaughtAt: pokemon.caughtAt
        };
      }
    });

    const uniquePokemonArray = Object.values(uniquePokemon).sort((a, b) => a.pokemonId - b.pokemonId);

    return res.status(200).json({
      caughtPokemon: user.caughtPokemon,
      uniquePokemon: uniquePokemonArray,
      totalCaught: user.caughtPokemon.length,
      uniqueCount: uniquePokemonArray.length,
      lastDailyCatch: user.lastDailyCatch
    });
  } catch (error) {
    console.error('Error fetching Pokedex:', error);
    return res.status(500).json({ error: 'Failed to fetch Pokedex' });
  }
};