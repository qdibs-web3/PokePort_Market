const connectToDatabase = require('./lib/mongodb');
const PokemonCard = require('./models/PokemonCard');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();

    switch (req.method) {
      case 'GET':
        return await getCards(req, res);
      case 'POST':
        return await createCard(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to format card response with multiple images support
function formatCardResponse(card) {
  const allImages = [...(card.imageUrls || [])];
  if (card.imageUrl && !allImages.includes(card.imageUrl)) {
    allImages.unshift(card.imageUrl);
  }
  
  return {
    id: card._id,
    name: card.name,
    description: card.description,
    price_eth: card.priceEth,
    image_url: allImages[0] || card.imageUrl, // First image for backward compatibility
    image_urls: allImages, // All images for carousel
    rarity: card.rarity,
    set_name: card.setName,
    card_number: card.cardNumber,
    condition: card.condition,
    stock_quantity: card.stockQuantity,
    is_active: card.isActive,
    created_at: card.createdAt,
    updated_at: card.updatedAt
  };
}

async function getCards(req, res) {
  try {
    const { page = 1, per_page = 20, rarity, set_name, q, include_inactive = false } = req.query;
    const pageNum = parseInt(page);
    const perPage = Math.min(parseInt(per_page), 100); // Limit to 100 per page
    const skip = (pageNum - 1) * perPage;

    let query = {};
    
    // Only show active cards by default, unless specifically requesting inactive ones
    if (include_inactive !== 'true') {
      query.isActive = true;
    }

    if (rarity) {
      query.rarity = rarity;
    }

    if (set_name) {
      query.setName = set_name;
    }

    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    const cards = await PokemonCard.find(query)
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 });

    const total = await PokemonCard.countDocuments(query);
    const pages = Math.ceil(total / perPage);

    // Format cards with multiple images support
    const formattedCards = cards.map(formatCardResponse);

    return res.status(200).json({
      cards: formattedCards,
      total,
      pages,
      current_page: pageNum
    });
  } catch (error) {
    console.error('Get cards error:', error);
    return res.status(500).json({ error: 'Failed to fetch cards' });
  }
}

async function createCard(req, res) {
  try {
    const {
      name,
      description,
      price_eth,
      image_url,
      image_urls,
      rarity,
      set_name,
      card_number,
      condition,
      stock_quantity
    } = req.body;

    // Validate required fields
    if (!name || !price_eth) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    if (price_eth <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    // Handle multiple images
    let imageUrls = [];
    if (image_urls && Array.isArray(image_urls)) {
      imageUrls = image_urls.filter(url => url && url.trim() !== '');
    }
    
    // Add single image_url to the array if provided and not already included
    if (image_url && image_url.trim() !== '' && !imageUrls.includes(image_url)) {
      imageUrls.unshift(image_url);
    }

    const card = new PokemonCard({
      name: name.trim(),
      description: description?.trim(),
      priceEth: parseFloat(price_eth),
      imageUrl: image_url?.trim(), // Keep for backward compatibility
      imageUrls: imageUrls, // New multiple images field
      rarity,
      setName: set_name?.trim(),
      cardNumber: card_number?.trim(),
      condition,
      stockQuantity: parseInt(stock_quantity) || 1
    });

    await card.save();

    const formattedCard = formatCardResponse(card);

    return res.status(201).json(formattedCard);
  } catch (error) {
    console.error('Create card error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: validationErrors });
    }
    
    return res.status(500).json({ error: 'Failed to create card' });
  }
}
