// pokemon-frontend/src/pages/Explore.jsx
import React, { useEffect, useState } from 'react';
import { fetchSeries, fetchSets, fetchCardsBySet } from '/src/lib/tcgdex';
import SeriesGrid from '/src/components/explore/SeriesGrid';
import SetsGrid from '/src/components/explore/SetsGrid';
import CardsGrid from '/src/components/explore/CardsGrid';

export default function Explore() {
  const [series, setSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState(null);

  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);

  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingSeries(true);
      try {
        const res = await fetchSeries();
        // API may return array or { data: [] }, normalize
        const list = Array.isArray(res) ? res : res.data ? res.data : res.series || [];
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

  async function onSerieClick(serie) {
    setSelectedSerie(serie);
    setSelectedSet(null);
    setCards([]);
    setLoadingSets(true);
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
    setLoadingCards(true);
    try {
      const cardsRes = await fetchCardsBySet(setItem.id || setItem.code || setItem.setId || setItem.id);
      // Normalize response
      const arr = Array.isArray(cardsRes) ? cardsRes : cardsRes.data ? cardsRes.data : cardsRes.cards || [];
      // ensure sorted by price (most expensive first)
      arr.sort((a, b) => (b?.price?.market ?? 0) - (a?.price?.market ?? 0));
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
      <section>
        <h1 className="text-3xl font-bold mb-2">Explore Series</h1>
        <p className="text-sm text-gray-500 mb-4">Browse Pokémon TCG series. Click a series to see sets, then click a set to list cards (by market price).</p>
        <SeriesGrid series={series} loading={loadingSeries} onSeriesClick={onSerieClick} selected={selectedSerie} />
      </section>

      <section>
        {selectedSerie && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Sets in {selectedSerie.name}</h2>
              <div className="text-sm text-gray-500">{loadingSets ? 'Loading sets...' : `${sets.length} sets`}</div>
            </div>
            <SetsGrid sets={sets} loading={loadingSets} onSetClick={onSetClick} selectedSet={selectedSet} />
          </>
        )}
      </section>

      <section id="cards-section">
        {selectedSet && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Cards in {selectedSet.name}</h2>
              <div className="text-sm text-gray-500">{loadingCards ? 'Loading cards...' : `${cards.length} cards`}</div>
            </div>
            <CardsGrid cards={cards} loading={loadingCards} />
          </>
        )}
      </section>
    </div>
  );
}
