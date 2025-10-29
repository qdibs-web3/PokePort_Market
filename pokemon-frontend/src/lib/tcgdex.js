// pokemon-frontend/src/lib/tcgdx.js
const BASE = 'https://api.tcgdex.net/v2/en'; // using v2 English endpoint

async function fetchJson(url ) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TCGdex error ${res.status}: ${text}`);
    }
    return res.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
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
  const url = `${BASE}/sets/${encodeURIComponent(setId)}`;
  const setData = await fetchJson(url);

  console.log('Raw set data:', setData); // Debug
  const cards = setData.cards || [];
  console.log('Raw cards array:', cards);

  // Fetch pricing data for each card individually
  const cardsWithPricing = await Promise.all(
    cards.map(async (card) => {
      try {
        // Fetch individual card data with pricing
        const cardData = await fetchJson(`${BASE}/cards/${encodeURIComponent(card.id)}`);
        
        // Extract pricing from the individual card API response
        const tcgPlayerPricing = cardData.pricing?.tcgplayer;
        let marketPrice = 0;
        
        if (tcgPlayerPricing) {
          // Try to get market price from normal variant first, then reverse-holofoil
          marketPrice = tcgPlayerPricing.normal?.marketPrice ?? 
                       tcgPlayerPricing['reverse-holofoil']?.marketPrice ?? 
                       tcgPlayerPricing.holofoil?.marketPrice ?? 0;
        }

        // Rarity from individual card data or fallback to set data
        const rarity = cardData.rarity || card.rarity || 'N/A';

        // Images - use the image from set data or individual card data
        let images = {};
        const imageUrl = card.image || cardData.image;
        if (imageUrl) {
          images.small = imageUrl.replace(/\/$/, '') + '/low.png';
          images.large = imageUrl.replace(/\/$/, '') + '/high.png';
        }

        return {
          id: card.id,
          name: card.name || cardData.name,
          number: card.localId || cardData.localId,
          rarity,
          set: setData.name,
          images,
          price: marketPrice,
          // Store the full pricing object for potential future use
          fullPricing: cardData.pricing
        };
      } catch (error) {
        console.error(`Error fetching pricing for card ${card.id}:`, error);
        // Return card with default pricing if individual fetch fails
        return {
          id: card.id,
          name: card.name,
          number: card.localId,
          rarity: card.rarity || 'N/A',
          set: setData.name,
          images: card.image ? {
            small: card.image.replace(/\/$/, '') + '/low.png',
            large: card.image.replace(/\/$/, '') + '/high.png'
          } : {},
          price: 0,
          fullPricing: null
        };
      }
    })
  );

  // Sort by price (highest first)
  return cardsWithPricing.sort((a, b) => b.price - a.price);
}

/**
 * Search for cards by Pokemon name across all English sets
 * @param {string} pokemonName - The name of the Pokemon to search for
 * @returns {Promise<Array>} Array of cards matching the Pokemon name
 */
export async function searchCardsByPokemon(pokemonName) {
  try {
    // Use the TCGdex search endpoint to find cards by name
    const url = `${BASE}/cards?name=${encodeURIComponent(pokemonName)}`;
    const searchResults = await fetchJson(url);
    
    // The API returns an array of card objects
    const cards = Array.isArray(searchResults) ? searchResults : [];
    
    // Fetch detailed information with pricing for each card
    const cardsWithDetails = await Promise.all(
      cards.map(async (card) => {
        try {
          // Fetch individual card data with pricing
          const cardData = await fetchJson(`${BASE}/cards/${encodeURIComponent(card.id)}`);
          
          // Extract pricing from the individual card API response
          const tcgPlayerPricing = cardData.pricing?.tcgplayer;
          let marketPrice = 0;
          
          if (tcgPlayerPricing) {
            marketPrice = tcgPlayerPricing.normal?.marketPrice ?? 
                         tcgPlayerPricing['reverse-holofoil']?.marketPrice ?? 
                         tcgPlayerPricing.holofoil?.marketPrice ?? 0;
          }

          // Images
          let images = {};
          const imageUrl = cardData.image || card.image;
          if (imageUrl) {
            images.small = imageUrl.replace(/\/$/, '') + '/low.png';
            images.large = imageUrl.replace(/\/$/, '') + '/high.png';
          }

          return {
            id: card.id || cardData.id,
            name: card.name || cardData.name,
            number: card.localId || cardData.localId,
            rarity: cardData.rarity || card.rarity || 'N/A',
            set: cardData.set?.name || card.set?.name || 'Unknown Set',
            images,
            price: marketPrice,
            fullPricing: cardData.pricing
          };
        } catch (error) {
          console.error(`Error fetching details for card ${card.id}:`, error);
          // Return basic card info if detailed fetch fails
          return {
            id: card.id,
            name: card.name,
            number: card.localId,
            rarity: card.rarity || 'N/A',
            set: card.set?.name || 'Unknown Set',
            images: card.image ? {
              small: card.image.replace(/\/$/, '') + '/low.png',
              large: card.image.replace(/\/$/, '') + '/high.png'
            } : {},
            price: 0,
            fullPricing: null
          };
        }
      })
    );

    // Sort by price (highest first)
    return cardsWithDetails.sort((a, b) => b.price - a.price);
  } catch (error) {
    console.error('Error searching for Pokemon cards:', error);
    return [];
  }
}