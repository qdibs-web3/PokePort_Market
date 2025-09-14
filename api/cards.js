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

async function getCards(req, res) {
  try {
    const { page = 1, per_page = 20, rarity, set_name, q } = req.query;
    const pageNum = parseInt(page);
    const perPage = parseInt(per_page);
    const skip = (pageNum - 1) * perPage;

    let query = { isActive: true };

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

    // Convert to match frontend expectations
    const formattedCards = cards.map(card => ({
      id: card._id,
      name: card.name,
      description: card.description,
      price_eth: card.priceEth,
      image_url: card.imageUrl,
      rarity: card.rarity,
      set_name: card.setName,
      card_number: card.cardNumber,
      condition: card.condition,
      stock_quantity: card.stockQuantity,
      is_active: card.isActive,
      created_at: card.createdAt,
      updated_at: card.updatedAt
    }));

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
      rarity,
      set_name,
      card_number,
      condition,
      stock_quantity
    } = req.body;

    const card = new PokemonCard({
      name,
      description,
      priceEth: price_eth,
      imageUrl: image_url,
      rarity,
      setName: set_name,
      cardNumber: card_number,
      condition,
      stockQuantity: stock_quantity || 1
    });

    await card.save();

    const formattedCard = {
      id: card._id,
      name: card.name,
      description: card.description,
      price_eth: card.priceEth,
      image_url: card.imageUrl,
      rarity: card.rarity,
      set_name: card.setName,
      card_number: card.cardNumber,
      condition: card.condition,
      stock_quantity: card.stockQuantity,
      is_active: card.isActive,
      created_at: card.createdAt,
      updated_at: card.updatedAt
    };

    return res.status(201).json(formattedCard);
  } catch (error) {
    console.error('Create card error:', error);
    return res.status(500).json({ error: 'Failed to create card' });
  }
}

