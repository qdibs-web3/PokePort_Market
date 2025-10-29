// pokemon-frontend/src/pages/Explore.jsx
import React, { useEffect, useState } from 'react';
import { fetchSeries, fetchSets, fetchCardsBySet } from '/src/lib/tcgdex';
import SeriesGrid from '/src/components/explore/SeriesGrid';
import SetsGrid from '/src/components/explore/SetsGrid';
import CardsGrid from '/src/components/explore/CardsGrid';
import PokemonSearch from '/src/components/explore/PokemonSearch';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Explore() {
  // Toggle between "Sets" and "Pokemon" modes
  const [viewMode, setViewMode] = useState('sets'); // 'sets' or 'pokemon'

  const [series, setSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState(null);
  const [seriesExpanded, setSeriesExpanded] = useState(true);

  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [setsExpanded, setSetsExpanded] = useState(true);

  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  
  // Filter state for cards
  const [sortBy, setSortBy] = useState('price'); // 'alphabetical', 'price', 'number'
  const [filteredCards, setFilteredCards] = useState([]);

  useEffect(() => {
    (async () => {
      setLoadingSeries(true);
      try {
        const res = await fetchSeries();
        // API returns a direct array of series
        const list = Array.isArray(res) ? res : [];
        // Sort alphabetically for easier navigation
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setSeries(list);
      } catch (err) {
        console.error('Error loading series', err);
      } finally {
        setLoadingSeries(false);
      }
    })();
  }, []);

  // Apply sorting to cards whenever cards or sortBy changes
  useEffect(() => {
    if (cards.length > 0) {
      const sorted = [...cards];
      if (sortBy === 'alphabetical') {
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (sortBy === 'price') {
        sorted.sort((a, b) => (b?.price?.market ?? 0) - (a?.price?.market ?? 0));
      } else if (sortBy === 'number') {
        sorted.sort((a, b) => {
          const numA = parseInt(a.number || a.localId || '0');
          const numB = parseInt(b.number || b.localId || '0');
          return numA - numB;
        });
      }
      setFilteredCards(sorted);
    } else {
      setFilteredCards([]);
    }
  }, [cards, sortBy]);

  async function onSerieClick(serie) {
    setSelectedSerie(serie);
    setSelectedSet(null);
    setCards([]);
    setFilteredCards([]);
    setLoadingSets(true);
    setSortBy('price'); // Reset sort
    
    // Collapse series section, expand sets section
    setSeriesExpanded(false);
    setSetsExpanded(true);
    
    try {
      // Best try to ask sets endpoint filtered by serie id
      const setsRes = await fetchSets({ serieId: serie.id || serie.code || serie.key });
      const arr = Array.isArray(setsRes) ? setsRes : setsRes.data ? setsRes.data : setsRes.sets || [];
      // sort by release date desc to show most recent first
      arr.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
      setSets(arr);
    } catch (err) {
      console.error('Error loading sets for serie', err);
      setSets([]);
    } finally {
      setLoadingSets(false);
    }
  }

  async function onSetClick(setItem) {
    setSelectedSet(setItem);
    setCards([]);
    setFilteredCards([]);
    setLoadingCards(true);
    setSortBy('price'); // Reset sort
    
    // Collapse sets section when a set is clicked
    setSetsExpanded(false);
    
    try {
      const cardsRes = await fetchCardsBySet(setItem.id || setItem.code || setItem.setId || setItem.id);
      // Normalize response
      const arr = Array.isArray(cardsRes) ? cardsRes : cardsRes.data ? cardsRes.data : cardsRes.cards || [];
      setCards(arr);
    } catch (err) {
      console.error('Error loading cards for set', err);
      setCards([]);
    } finally {
      setLoadingCards(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toggle Section - Sets vs Pokemon */}
      <div className="flex justify-start">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1 shadow-sm">
          <button
            onClick={() => setViewMode('sets')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'sets'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Sets
          </button>
          <button
            onClick={() => setViewMode('pokemon')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'pokemon'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Singles
          </button>
        </div>
      </div>

      {/* Conditional Rendering based on viewMode */}
      {viewMode === 'sets' ? (
        <>
          {/* Series Section */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setSeriesExpanded(!seriesExpanded)}
            >
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedSerie ? selectedSerie.name : 'Explore Series'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedSerie 
                    ? 'Click to view all series' 
                    : 'Browse Pokémon TCG series. Click a series to see sets.'}
                </p>
              </div>
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                {seriesExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
            
            {seriesExpanded && (
              <div className="p-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <SeriesGrid 
                  series={series} 
                  loading={loadingSeries} 
                  onSeriesClick={onSerieClick} 
                  selected={selectedSerie} 
                />
              </div>
            )}
          </section>

          {/* Sets Section */}
          {selectedSerie && (
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setSetsExpanded(!setsExpanded)}
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedSet ? selectedSet.name : `Sets in ${selectedSerie.name}`}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {loadingSets ? 'Loading sets...' : `${sets.length} sets available`}
                  </p>
                </div>
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                  {setsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
              </div>
              
              {setsExpanded && (
                <div className="p-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <SetsGrid 
                    sets={sets} 
                    loading={loadingSets} 
                    onSetClick={onSetClick} 
                    selectedSet={selectedSet} 
                  />
                </div>
              )}
            </section>
          )}

          {/* Cards Section */}
          {selectedSet && (
            <section id="cards-section" className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-lg shadow-md border border-indigo-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Cards in {selectedSet.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {loadingCards ? 'Loading cards...' : `${filteredCards.length} cards`}
                    </p>
                  </div>
                  
                  {/* Filter Buttons */}
                  {!loadingCards && filteredCards.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSortBy('alphabetical')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            sortBy === 'alphabetical'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          A-Z
                        </button>
                        <button
                          onClick={() => setSortBy('price')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            sortBy === 'price'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          Price
                        </button>
                        <button
                          onClick={() => setSortBy('number')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            sortBy === 'number'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          Set #
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <CardsGrid cards={filteredCards} loading={loadingCards} />
              </div>
            </section>
          )}
        </>
      ) : (
        /* Pokemon Search Mode */
        <PokemonSearch />
      )}
    </div>
  );
}