  // src/components/pages/Pokedex.jsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Search } from 'lucide-react';

const Pokedex = ({ user }) => {
  const [pokedexData, setPokedexData] = useState(null);
  const [allPokemon, setAllPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const TOTAL_POKEMON = 151; // Gen 1

  useEffect(() => {
    if (user) {
      fetchPokedex();
    }
    fetchAllPokemon();
  }, [user]);

  const fetchPokedex = async () => {
    try {
      const response = await fetch(`/api/pokedex/${user.wallet_address}`);
      if (response.ok) {
        const data = await response.json();
        setPokedexData(data);
      }
    } catch (error) {
      console.error('Error fetching Pokedex:', error);
    }
  };

  const fetchAllPokemon = async () => {
    try {
      // Fetch basic info for all Gen 1 Pokemon
      const pokemonList = [];
      for (let i = 1; i <= TOTAL_POKEMON; i++) {
        pokemonList.push({
          id: i,
          name: `pokemon-${i}`,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${i}.png`
        });
      }
      setAllPokemon(pokemonList);
    } catch (error) {
      console.error('Error fetching Pokemon list:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPokemonCaught = (pokemonId) => {
    if (!pokedexData) return false;
    return pokedexData.uniquePokemon.some(p => p.pokemonId === pokemonId);
  };

  const getCaughtPokemonData = (pokemonId) => {
    if (!pokedexData) return null;
    return pokedexData.uniquePokemon.find(p => p.pokemonId === pokemonId);
  };

  const filteredPokemon = allPokemon.filter(pokemon => {
    const caughtData = getCaughtPokemonData(pokemon.id);
    const matchesSearch = caughtData 
      ? caughtData.pokemonName.toLowerCase().includes(searchTerm.toLowerCase()) || pokemon.id.toString().includes(searchTerm)
      : pokemon.id.toString().includes(searchTerm);
    
    if (filterType === 'caught') {
      return isPokemonCaught(pokemon.id) && matchesSearch;
    } else if (filterType === 'uncaught') {
      return !isPokemonCaught(pokemon.id) && matchesSearch;
    }
    return matchesSearch;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to view your Pokedex!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Pokedex...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 pokemon-font">
          My Pokedex
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {pokedexData ? `${pokedexData.uniqueCount} / ${TOTAL_POKEMON} Pokemon Caught` : 'Loading...'}
        </p>
      </div>

      {/* Stats Cards */}
      {pokedexData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Unique Pokemon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {pokedexData.uniqueCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Catches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {pokedexData.totalCaught}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round((pokedexData.uniqueCount / TOTAL_POKEMON) * 100)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('caught')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'caught'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Caught
              </button>
              <button
                onClick={() => setFilterType('uncaught')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'uncaught'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Uncaught
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pokemon Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredPokemon.map((pokemon) => {
          const caught = isPokemonCaught(pokemon.id);
          const caughtData = getCaughtPokemonData(pokemon.id);

          return (
            <Card
              key={pokemon.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                caught
                  ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-300 dark:border-green-700'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              }`}
            >
              <CardContent className="p-4 text-center">
                <div className="relative mb-2">
                  <img
                    src={pokemon.sprite}
                    alt={caught ? caughtData.pokemonName : `Pokemon #${pokemon.id}`}
                    className={`w-full h-24 object-contain mx-auto ${
                      !caught ? 'filter brightness-0 opacity-20' : ''
                    }`}
                  />
                  {!caught && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl">❓</span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  #{pokemon.id.toString().padStart(3, '0')}
                </p>
                
                {caught ? (
                  <>
                    <p className="font-semibold text-sm capitalize text-gray-900 dark:text-gray-100">
                      {caughtData.pokemonName}
                    </p>
                    <Badge variant="success" className="mt-2 bg-green-500 text-white text-xs">
                      Caught
                    </Badge>
                  </>
                ) : (
                  <p className="font-semibold text-sm text-gray-400 dark:text-gray-500">
                    ???
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPokemon.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No Pokemon found matching your search.
          </p>
        </div>
      )}
    </div>
  );
};

export default Pokedex;