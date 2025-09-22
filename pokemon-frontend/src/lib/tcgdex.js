// pokemon-frontend/src/lib/tcgdex.js
const BASE = 'https://api.tcgdex.net/v2/en'; // using v2 English endpoint

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TCGdex error ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Get all series (English)
 */
export async function fetchSeries() {
  return fetchJson(`${BASE}/series`);
}

/**
 * Get sets for a given series
 */
export async function fetchSets({ serieId } = {}) {
  const url = `${BASE}/series/${encodeURIComponent(serieId)}`;
  const data = await fetchJson(url);

  // API returns an object with a `sets` array inside
  return data.sets || [];
}

export async function fetchCardsBySet(setId) {
  const url = `https://api.tcgdex.net/v2/en/sets/${encodeURIComponent(setId)}`;
  const setData = await fetchJson(url);

  console.log('Raw set data:', setData); // Debug
  const cards = setData.cards || [];
  console.log('Raw cards array:', cards);

  return cards
    .map((card) => {
      // Price: normal first, then holofoil
      const price =
        card?.tcgplayer?.prices?.normal?.market ??
        card?.tcgplayer?.prices?.holofoil?.market ??
        0;

      // Rarity
      const rarity = card.rarity || card?.tcgplayer?.rarity || 'N/A';

      // Images
      let images = {};
      if (card.image) {
        // Convert to high-resolution URL
        // Example: https://assets.tcgdex.net/en/sm/sm12/86/high.png
        images.small = card.image.replace(/\/$/, '') + '/low.png';
        images.large = card.image.replace(/\/$/, '') + '/low.png';
      } else if (card.images) {
        // Keep existing object if present
        images = card.images;
      }

      return {
        id: card.id,
        name: card.name,
        number: card.number,
        rarity,
        set: card.set?.name || setData.name,
        images,
        price,
      };
    })
    .sort((a, b) => b.price - a.price);
}



