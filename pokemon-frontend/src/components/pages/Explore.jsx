// pokemon-frontend/src/pages/Explore.jsx
import React, { useEffect, useState } from 'react';
import { fetchSeries, fetchSets, fetchCardsBySet } from '/src/lib/tcgdex';
import SeriesGrid from '/src/components/explore/SeriesGrid';
import SetsGrid from '/src/components/explore/SetsGrid';
import CardsGrid from '/src/components/explore/CardsGrid';
import { ChevronDown, ChevronUp } from 'lucide-react';
import plogo from '/src/assets/plogo.png'; 
import epika from '/src/assets/epika.png'; 
import ppika from '/src/assets/ppika.png';
import spika from '/src/assets/spika.png';


export default function Explore() {
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
      // scroll to cards
      setTimeout(() => {
        document.getElementById('cards-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err) {
      console.error('Error loading cards for set', err);
      setCards([]);
    } finally {
      setLoadingCards(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Intro Information Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-yellow rounded-lg p-6">

      {/* Left Column */}
      <div className="flex flex-col items-center text-center">
        <img
          src={epika}
          alt="Card Explorer Logo"
          className="w-32 h-32 object-contain mb-4"
        />
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Card Explorer</h2>
          <a
            href="/explore"
            className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full"
          >
            Go
          </a>
        </div>
        <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
          <li className="flex items-center">
            <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
            Browse all Pokémon generations
          </li>
          <li className="flex items-center">
            <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
            View detailed card stats and data
          </li>
          <li className="flex items-center">
            <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
            Track prices and rarity info
          </li>
          <li className="flex items-center">
            <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
            Explore release history
          </li>
        </ul>
      </div>

      {/* Middle Column */}
      <div className="flex flex-col items-center text-center">
        <img
          src={spika}
          alt="Shop Logo"
          className="w-32 h-32 object-contain mb-4"
        />
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Shop Pokémon</h2>
          <a
            href="/market"
            className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full"
          >
            Go
          </a>
        </div>
        <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
          <li className="flex items-center">
            <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
            Raw & Graded Cards
          </li>
          <li className="flex items-center">
            <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
            High End Sealed Product
          </li>
          <li className="flex items-center">
            <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
            Customized Designs, Text, & Colors
          </li>
          <li className="flex items-center">
            <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
            Mystery Packs 'Coming Soon?'
          </li>
        </ul>
      </div>

      {/* Right Column */}
      <div className="flex flex-col items-center text-center">
        <img
          src={ppika}
          alt="3D Prints Logo"
          className="w-32 h-32 object-contain mb-4"
        />
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Custom 3D Prints</h2>
          <a
            href="/market"
            className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full"
          >
            Go
          </a>
        </div>
        <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
          <li className="flex items-center">
            <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
            Order personalized card displays
          </li>
          <li className="flex items-center">
            <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
            Choose from multiple styles
          </li>
          <li className="flex items-center">
            <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
            Match your favorite Pokémon style
          </li>
          <li className="flex items-center">
            <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
            Community-inspired designs
          </li>
        </ul>
      </div>

    </section>


      {/* Series Section */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setSeriesExpanded(!seriesExpanded)}
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedSerie ? selectedSerie.name : 'Explore Series'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {selectedSerie 
                ? 'Click to view all series' 
                : 'Browse Pokémon TCG series. Click a series to see sets.'}
            </p>
          </div>
          <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            {seriesExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
        
        {seriesExpanded && (
          <div className="p-4 pt-0 border-t border-gray-100">
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
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setSetsExpanded(!setsExpanded)}
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSet ? selectedSet.name : `Sets in ${selectedSerie.name}`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {loadingSets ? 'Loading sets...' : `${sets.length} sets available`}
              </p>
            </div>
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              {setsExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
          
          {setsExpanded && (
            <div className="p-4 pt-0 border-t border-gray-100">
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
        <section id="cards-section" className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg shadow-md border border-indigo-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Cards in {selectedSet.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {loadingCards ? 'Loading cards...' : `${filteredCards.length} cards`}
                </p>
              </div>
              
              {/* Filter Buttons */}
              {!loadingCards && filteredCards.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('alphabetical')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        sortBy === 'alphabetical'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      A-Z
                    </button>
                    <button
                      onClick={() => setSortBy('price')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        sortBy === 'price'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Price
                    </button>
                    <button
                      onClick={() => setSortBy('number')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        sortBy === 'number'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
    </div>
  );
}