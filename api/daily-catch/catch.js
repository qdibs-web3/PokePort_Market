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

    // Check if user can catch (1 hour since last catch)
    const now = new Date();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    if (user.lastDailyCatch) {
      const lastCatch = new Date(user.lastDailyCatch);
      const timeSinceLastCatch = now - lastCatch;

      if (timeSinceLastCatch < oneHour) {
        const timeRemaining = oneHour - timeSinceLastCatch;
        const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));
        
        return res.status(400).json({ 
          error: `You can catch another Pokemon in ${minutesRemaining} minutes!`,
          alreadyCaught: true,
          timeUntilNext: timeRemaining
        });
      }
    }

    // Initialize caughtPokemon array if it doesn't exist
    if (!user.caughtPokemon) {
      user.caughtPokemon = [];
    }

    // Check if user already has this exact Pokemon
    const alreadyHasPokemon = user.caughtPokemon.some(p => p.pokemonId === pokemonId);

    // Only add if not already in collection (prevents duplicates)
    if (!alreadyHasPokemon) {
      const newCatch = {
        pokemonId,
        pokemonName,
        sprite,
        caughtAt: new Date()
      };

      // Use atomic operation to prevent race conditions
      // This ensures even if two requests come simultaneously, only one is added
      const result = await User.findOneAndUpdate(
        { 
          walletAddress: wallet_address.toLowerCase(),
          'caughtPokemon.pokemonId': { $ne: pokemonId } // Only update if Pokemon doesn't exist
        },
        { 
          $push: { caughtPokemon: newCatch },
          $set: { lastDailyCatch: new Date() }
        },
        { new: true }
      );

      if (result) {
        console.log('Added new Pokemon to collection:', pokemonName, '#' + pokemonId);
      } else {
        console.log('Pokemon was already added by another request:', pokemonName, '#' + pokemonId);
        // Fetch updated user to get latest data
        const updatedUser = await User.findOne({ walletAddress: wallet_address.toLowerCase() });
        return res.status(200).json({ 
          success: true, 
          message: `You caught ${pokemonName}! (Already in your Pokedex)`,
          pokemon: newCatch,
          isNewEntry: false,
          totalCaught: updatedUser.caughtPokemon.length
        });
      }
    } else {
      console.log('Pokemon already in collection, not adding duplicate:', pokemonName, '#' + pokemonId);
      // Just update last catch time
      await User.findOneAndUpdate(
        { walletAddress: wallet_address.toLowerCase() },
        { $set: { lastDailyCatch: new Date() } }
      );
    }

    // Fetch fresh user data
    const updatedUser = await User.findOne({ walletAddress: wallet_address.toLowerCase() });

    console.log('Catch successful for user:', wallet_address);
    console.log('Total unique Pokemon:', updatedUser.caughtPokemon.length);

    return res.status(200).json({ 
      success: true, 
      message: alreadyHasPokemon 
        ? `You caught ${pokemonName}! (Already in your Pokedex)` 
        : `New Pokemon caught! ${pokemonName} added to your Pokedex!`,
      pokemon: {
        pokemonId,
        pokemonName,
        sprite,
        caughtAt: new Date()
      },
      isNewEntry: !alreadyHasPokemon,
      totalCaught: updatedUser.caughtPokemon.length
    });
  } catch (error) {
    console.error('Error catching Pokemon:', error);
    return res.status(500).json({ error: 'Failed to catch Pokemon' });
  }
};