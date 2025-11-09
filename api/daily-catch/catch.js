// api/daily-catch/catch.js
const connectToDatabase = require('../_lib/mongodb');
const User = require('../_models/User');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { wallet_address, pokemonId, pokemonName, sprite } = req.body;

    if (!wallet_address || !pokemonId || !pokemonName || !sprite) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user
    const user = await User.findOne({ walletAddress: wallet_address.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already caught today's Pokemon
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (user.lastDailyCatch && new Date(user.lastDailyCatch) >= today) {
      return res.status(400).json({ 
        error: 'You have already caught today\'s Pokemon!',
        alreadyCaught: true 
      });
    }

    // Check if user already has this Pokemon in their Pokedex
    const alreadyHasPokemon = user.caughtPokemon.some(p => p.pokemonId === pokemonId);

    // Add Pokemon to caught list (even if duplicate, for collection purposes)
    const newCatch = {
      pokemonId,
      pokemonName,
      sprite,
      caughtAt: new Date()
    };

    user.caughtPokemon.push(newCatch);
    user.lastDailyCatch = new Date();

    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: alreadyHasPokemon 
        ? `You caught ${pokemonName}! (Already in your Pokedex)` 
        : `New Pokemon caught! ${pokemonName} added to your Pokedex!`,
      pokemon: newCatch,
      isNewEntry: !alreadyHasPokemon,
      totalCaught: user.caughtPokemon.length
    });
  } catch (error) {
    console.error('Error catching Pokemon:', error);
    return res.status(500).json({ error: 'Failed to catch Pokemon' });
  }
};