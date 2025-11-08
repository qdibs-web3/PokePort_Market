// pokemon-frontend/src/lib/tcgdx.js

async function fetchJson(url) {
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
 * Get the base URL for the specified language
 * @param {string} language - 'en' for English or 'ja' for Japanese
 * @returns {string} Base API URL
 */
function getBaseUrl(language = 'en') {
  return `https://api.tcgdex.net/v2/${language}`;
}

/**
 * Get all series
 * @param {string} language - 'en' for English or 'ja' for Japanese
 */
export async function fetchSeries(language = 'en') {
  const BASE = getBaseUrl(language);
  return fetchJson(`${BASE}/series`);
}

/**
 * Get sets for a given series
 * @param {Object} params - Parameters object
 * @param {string} params.serieId - The series ID
 * @param {string} params.language - 'en' for English or 'ja' for Japanese
 */
export async function fetchSets({ serieId, language = 'en' } = {}) {
  const BASE = getBaseUrl(language);
  const url = `${BASE}/series/${encodeURIComponent(serieId)}`;
  const data = await fetchJson(url);

  // API returns an object with a `sets` array inside
  return data.sets || [];
}

/**
 * Fetch cards by set with pricing
 * @param {string} setId - The set ID
 * @param {string} language - 'en' for English or 'ja' for Japanese
 */
export async function fetchCardsBySet(setId, language = 'en') {
  const BASE = getBaseUrl(language);
  const url = `${BASE}/sets/${encodeURIComponent(setId)}`;
  const setData = await fetchJson(url);

  console.log('Raw set data:', setData); // Debug
  const cards = setData.cards || [];
  console.log('Raw cards array:', cards);

  // Fetch pricing data for each card
  const cardsWithPricing = await Promise.all(
    cards.map(async (card) => {
      try {
        // Fetch individual card data with pricing from the selected language
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

        // Images - properly construct URLs
        let images = {};
        const imageUrl = cardData.image || card.image;
        if (imageUrl) {
          // Remove trailing slash if present and append the image quality paths
          const baseImageUrl = imageUrl.replace(/\/$/, '');
          images.small = `${baseImageUrl}/low.png`;
          images.large = `${baseImageUrl}/high.png`;
        }

        return {
          id: card.id,
          name: cardData.name || card.name,
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
        const imageUrl = card.image;
        let images = {};
        if (imageUrl) {
          const baseImageUrl = imageUrl.replace(/\/$/, '');
          images.small = `${baseImageUrl}/low.png`;
          images.large = `${baseImageUrl}/high.png`;
        }
        
        return {
          id: card.id,
          name: card.name,
          number: card.localId,
          rarity: card.rarity || 'N/A',
          set: setData.name,
          images,
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
 * Search for cards by Pokemon name across all sets
 * @param {string} pokemonName - The name of the Pokemon to search for
 * @param {string} language - 'en' for English or 'ja' for Japanese
 * @returns {Promise<Array>} Array of cards matching the Pokemon name
 */
export async function searchCardsByPokemon(pokemonName, language = 'en') {
  try {
    const BASE = getBaseUrl(language);
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

          // Images - properly construct URLs
          let images = {};
          const imageUrl = cardData.image || card.image;
          if (imageUrl) {
            const baseImageUrl = imageUrl.replace(/\/$/, '');
            images.small = `${baseImageUrl}/low.png`;
            images.large = `${baseImageUrl}/high.png`;
          }

          return {
            id: card.id || cardData.id,
            name: cardData.name || card.name,
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
          const imageUrl = card.image;
          let images = {};
          if (imageUrl) {
            const baseImageUrl = imageUrl.replace(/\/$/, '');
            images.small = `${baseImageUrl}/low.png`;
            images.large = `${baseImageUrl}/high.png`;
          }
          
          return {
            id: card.id,
            name: card.name,
            number: card.localId,
            rarity: card.rarity || 'N/A',
            set: card.set?.name || 'Unknown Set',
            images,
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