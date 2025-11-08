// pokemon-frontend/src/components/explore/PokemonSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { searchCardsByPokemon } from '/src/lib/tcgdex';
import CardsGrid from './CardsGrid';

export default function PokemonSearch({ language = 'en' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search query is empty, reset
    if (!searchQuery.trim()) {
      setCards([]);
      setHasSearched(false);
      return;
    }

    // Set a new timeout for search
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const results = await searchCardsByPokemon(searchQuery.trim(), language);
        setCards(results);
      } catch (error) {
        console.error('Error searching for Pokemon:', error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    // Cleanup timeout on unmount or when query changes
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, language]);

  // Reset search when language changes
  useEffect(() => {
    if (hasSearched && searchQuery.trim()) {
      // Re-trigger search with new language
      setLoading(true);
      searchCardsByPokemon(searchQuery.trim(), language)
        .then(results => {
          setCards(results);
        })
        .catch(error => {
          console.error('Error searching for Pokemon:', error);
          setCards([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [language]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setCards([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Input Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
              Search a Pokémon
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
              Type a Pokémon name to see all cards from {language === 'en' ? 'English' : 'Japanese'} sets
            </p>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Pikachu, Charizard, Mewtwo..."
                className="w-full pl-12 pr-12 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 dark:placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Search Status */}
            {loading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>Searching for "{searchQuery}" in {language === 'en' ? 'English' : 'Japanese'} sets...</span>
                </div>
              </div>
            )}

            {!loading && hasSearched && cards.length === 0 && (
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No cards found for "{searchQuery}". Try a different Pokémon name.
              </div>
            )}

            {!loading && hasSearched && cards.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Found <span className="font-semibold text-indigo-600 dark:text-indigo-400">{cards.length}</span> cards for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {hasSearched && cards.length > 0 && (
        <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-lg shadow-md border border-indigo-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1)} Cards
            </h3>
            <CardsGrid cards={cards} loading={false} />
          </div>
        </section>
      )}

      {/* Empty State - No search yet */}
      {!hasSearched && !loading && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
              <Search className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Start Your Search
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Enter a Pokémon name above to discover all their trading cards from {language === 'en' ? 'English' : 'Japanese'} sets. 
              Results include pricing information from TCGPlayer.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}