// src/components/pages/Pokedex.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Pokedex = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pokedexData, setPokedexData] = useState(null);
  const [allPokemon, setAllPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const highlightedPokemonRef = useRef(null);

  const TOTAL_POKEMON = 151; // Gen 1
  const highlightPokemonId = location.state?.highlightPokemon;

  useEffect(() => {
    if (user) {
      fetchPokedex();
    }
    fetchAllPokemon();
  }, [user]);

  // Scroll to highlighted Pokemon
  useEffect(() => {
    if (highlightPokemonId && highlightedPokemonRef.current) {
      setTimeout(() => {
        highlightedPokemonRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500);
    }
  }, [highlightPokemonId, allPokemon]);

  const fetchPokedex = async () => {
    try {
      const walletAddress = user.wallet_address || user.walletAddress;
      console.log('Fetching Pokedex for:', walletAddress);
      
      const response = await fetch(`/api/pokedex/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Pokedex data:', data);
        setPokedexData(data);
      } else {
        console.error('Failed to fetch Pokedex:', response.status);
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
      {/* Back Button */}
      <div className="mb-6">
        <Button
          onClick={() => navigate('/daily-catch')}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Daily Catch
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 pokemon-font">
          My Gen 1, 151 Pokedex
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {pokedexData ? `${pokedexData.uniqueCount} / ${TOTAL_POKEMON} Pokemon Caught` : 'Loading...'}
        </p>
      </div>

      {/* Stats Cards */}
      {pokedexData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-700 dark:text-blue-300">Unique Pokemon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {pokedexData.uniqueCount}
              </p>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">
                Different species
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-700 dark:text-green-300">Total Catches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {pokedexData.totalCaught}
              </p>
              <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-1">
                Pokemon caught
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-purple-700 dark:text-purple-300">Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round((pokedexData.uniqueCount / TOTAL_POKEMON) * 100)}%
              </p>
              <p className="text-sm text-purple-600/70 dark:text-purple-400/70 mt-1">
                Pokedex filled
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
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All ({allPokemon.length})
              </button>
              <button
                onClick={() => setFilterType('caught')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'caught'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Caught ({pokedexData?.uniqueCount || 0})
              </button>
              <button
                onClick={() => setFilterType('uncaught')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'uncaught'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Uncaught ({TOTAL_POKEMON - (pokedexData?.uniqueCount || 0)})
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
          const isHighlighted = highlightPokemonId === pokemon.id;

          return (
            <Card
              key={pokemon.id}
              ref={isHighlighted ? highlightedPokemonRef : null}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                caught
                  ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-300 dark:border-green-700'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-70'
              } ${
                isHighlighted ? 'ring-4 ring-yellow-400 animate-pulse shadow-2xl scale-110' : ''
              }`}
            >
              {isHighlighted && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-black text-xs font-bold text-center py-1 z-10">
                  ⭐ NEW CATCH! ⭐
                </div>
              )}
              <CardContent className={`p-4 text-center ${isHighlighted ? 'pt-8' : ''}`}>
                <div className="relative mb-2 h-28 flex items-center justify-center">
                  <img
                    src={pokemon.sprite}
                    alt={caught ? caughtData.pokemonName : `Pokemon #${pokemon.id}`}
                    className={`w-full h-full object-contain mx-auto transition-all ${
                      !caught ? 'filter brightness-0 opacity-20' : ''
                    } ${isHighlighted ? 'animate-bounce' : ''}`}
                    style={caught ? { imageRendering: 'pixelated' } : {}}
                  />
                  {!caught && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl">❓</span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">
                  #{pokemon.id.toString().padStart(3, '0')}
                </p>
                
                {caught ? (
                  <>
                    <p className="font-semibold text-sm capitalize text-gray-900 dark:text-gray-100 mb-2">
                      {caughtData.pokemonName}
                    </p>
                    <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                      ✓ Caught
                    </Badge>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sm text-gray-400 dark:text-gray-500 mb-2">
                      ???
                    </p>
                    <Badge variant="secondary" className="text-xs opacity-50">
                      Not Caught
                    </Badge>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPokemon.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No Pokemon found matching your search.
          </p>
        </div>
      )}

      {/* Bottom Action Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={() => navigate('/daily-catch')}
          size="lg"
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Daily Catch
        </Button>
      </div>
    </div>
  );
};

export default Pokedex;