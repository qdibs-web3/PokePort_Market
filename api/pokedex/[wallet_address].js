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

    // Get wallet address from URL params (Express/Vercel style)
    // Try multiple ways to get the wallet address
    let wallet_address = req.query.wallet_address || req.params.wallet_address;
    
    // If using path-based routing like /api/pokedex/0x123...
    // Extract from URL
    if (!wallet_address && req.url) {
      const urlParts = req.url.split('/');
      wallet_address = urlParts[urlParts.length - 1];
      // Remove query string if present
      if (wallet_address.includes('?')) {
        wallet_address = wallet_address.split('?')[0];
      }
    }

    console.log('Pokedex request - URL:', req.url);
    console.log('Pokedex request - Query:', req.query);
    console.log('Pokedex request - Params:', req.params);
    console.log('Pokedex request - Wallet:', wallet_address);

    if (!wallet_address || wallet_address === 'undefined') {
      console.error('No valid wallet address provided');
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Find user
    const user = await User.findOne({ walletAddress: wallet_address.toLowerCase() });

    if (!user) {
      console.error('User not found:', wallet_address);
      // Return empty Pokedex instead of 404 for better UX
      return res.status(200).json({
        caughtPokemon: [],
        uniquePokemon: [],
        totalCaught: 0,
        uniqueCount: 0,
        lastDailyCatch: null
      });
    }

    console.log('User found:', user.walletAddress);
    console.log('Caught Pokemon count:', user.caughtPokemon?.length || 0);

    // Initialize caughtPokemon if it doesn't exist
    if (!user.caughtPokemon) {
      user.caughtPokemon = [];
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

    console.log('Returning Pokedex data - Unique:', uniquePokemonArray.length, 'Total:', user.caughtPokemon.length);

    return res.status(200).json({
      caughtPokemon: user.caughtPokemon,
      uniquePokemon: uniquePokemonArray,
      totalCaught: user.caughtPokemon.length,
      uniqueCount: uniquePokemonArray.length,
      lastDailyCatch: user.lastDailyCatch
    });
  } catch (error) {
    console.error('Error fetching Pokedex:', error);
    return res.status(500).json({ error: 'Failed to fetch Pokedex', details: error.message });
  }
};