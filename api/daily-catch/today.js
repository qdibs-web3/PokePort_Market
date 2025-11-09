// api/daily-catch/today.js
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
    // Generate deterministic daily Pokemon based on today's date
    const today = new Date();
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    // Use date as seed for consistent daily Pokemon (1-151 for Gen 1)
    const seed = parseInt(dateString);
    const pokemonId = (seed % 151) + 1;

    // Fetch Pokemon data from PokeAPI
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch Pokemon data');
    }

    const pokemonData = await response.json();

    const dailyPokemon = {
      pokemonId: pokemonData.id,
      pokemonName: pokemonData.name,
      sprite: pokemonData.sprites?.other?.['official-artwork']?.front_default || pokemonData.sprites?.front_default,
      types: pokemonData.types.map(t => t.type.name),
      stats: pokemonData.stats.reduce((acc, s) => ({ ...acc, [s.stat.name]: s.base_stat }), {})
    };

    return res.status(200).json(dailyPokemon);
  } catch (error) {
    console.error('Error fetching daily Pokemon:', error);
    return res.status(500).json({ error: 'Failed to fetch daily Pokemon' });
  }
};