// pokemon-frontend/src/components/explore/CardsGrid.jsx
import React from 'react';

export default function CardsGrid({ cards = [], loading = false }) {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <div className="text-gray-500">Loading cards...</div>
          <div className="text-sm text-gray-400">Fetching pricing information from TCGPlayer</div>
        </div>
      </div>
    );
  }
  if (!cards || cards.length === 0) return <div className="py-8 text-gray-500">No cards in this set.</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
      {cards.map((c) => {
        const image = c.images?.small || c.images?.large || c.image || (c.variant && c.variant.image);
        const name = c.name || c.title || c.localName;
        const setName = c.set?.name || c.setName || c.setNameLocal;
        const number = c.number || c.localId || c.id;
        const rarity = c.rarity || (c.rarityLocal && c.rarityLocal.join(', ')) || 'Unknown';
        const market = c.price ?? c.marketPrice ?? c.prices?.market ?? 0;

        return (
          <div key={c.id || `${setName}-${number}-${name}`} className="bg-black/9 p-1 rounded-md border">
            <div className="w-full h-55 bg-gray-250 rounded mb-2 flex items-center justify-center overflow-hidden">
              {image ? (
                <img src={image} alt={name} className="object-contain max-h-full" />
              ) : (
                <div className="text-sm text-gray-400">No image</div>
              )}
            </div>

            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-xs text-black-800">{setName} • #{number}</div>

            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-gray-600">Rarity: <span className="font-medium text-sm text-gray-900">{rarity}</span></div>
              <div className="text-right">
                {market > 0 ? (
                  <>
                    <div className="text-sm font-semibold text-green-600">${market.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">TCGPlayer</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-gray-400">N/A</div>
                    <div className="text-xs text-gray-400">No pricing</div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
