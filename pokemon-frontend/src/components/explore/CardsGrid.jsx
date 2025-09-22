// pokemon-frontend/src/components/explore/CardsGrid.jsx
import React from 'react';

export default function CardsGrid({ cards = [], loading = false }) {
  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading cards…</div>;
  }
  if (!cards || cards.length === 0) return <div className="py-8 text-gray-500">No cards in this set.</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
      {cards.map((c) => {
        const image = c.image || c.images?.small || c.images?.large || (c.variant && c.variant.image);
        const name = c.name || c.title || c.localName;
        const setName = c.set?.name || c.setName || c.setNameLocal;
        const number = c.number || c.localId || c.id;
        const rarity = c.rarity || (c.rarityLocal && c.rarityLocal.join(', ')) || 'Unknown';
        const market = c.price?.market ?? c.marketPrice ?? c.prices?.market ?? null;

        return (
          <div key={c.id || `${setName}-${number}-${name}`} className="bg-black/9 p-3 rounded-md border">
            <div className="w-full h-55 bg-gray-900 rounded mb-2 flex items-center justify-center overflow-hidden">
              {image ? (
                <img src={image} alt={name} className="object-contain max-h-full" />
              ) : (
                <div className="text-sm text-gray-400">No image</div>
              )}
            </div>

            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-xs text-black-800">{setName} • #{number}</div>

            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-black-300">Rarity: <span className="font-medium text-sm text-black">{rarity}</span></div>
              <div className="text-right">
                <div className="text-sm font-semibold">${(market ?? 0).toFixed(2)}</div>
                <div className="text-xs text-black-400">market</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
