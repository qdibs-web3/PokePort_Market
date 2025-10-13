const connectToDatabase = require('../_lib/mongodb');
const PokemonCard = require('../_models/PokemonCard');

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

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Card ID is required' });
    }

    switch (req.method) {
      case 'GET':
        return await getCard(req, res, id);
      case 'PUT':
        return await updateCard(req, res, id);
      case 'DELETE':
        return await deleteCard(req, res, id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Card API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getCard(req, res, id) {
  try {
    const card = await PokemonCard.findById(id);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const formattedCard = {
      id: card._id,
      name: card.name,
      description: card.description,
      price_eth: card.priceEth,
      image_url: card.imageUrl,
      rarity: card.rarity,
      product_type: card.productType,
      grading_company: card.gradingCompany,
      grade: card.grade,
      set_name: card.setName,
      card_number: card.cardNumber,
      condition: card.condition,
      stock_quantity: card.stockQuantity,
      is_active: card.isActive,
      created_at: card.createdAt,
      updated_at: card.updatedAt
    };

    return res.status(200).json(formattedCard);
  } catch (error) {
    console.error('Get card error:', error);
    return res.status(500).json({ error: 'Failed to fetch card' });
  }
}

async function updateCard(req, res, id) {
  try {
    const {
      name,
      description,
      price_eth,
      image_url,
      rarity,
      product_type,
      grading_company,
      grade,
      set_name,
      card_number,
      condition,
      stock_quantity,
      is_active
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price_eth !== undefined) updateData.priceEth = parseFloat(price_eth);
    if (image_url !== undefined) updateData.imageUrl = image_url;
    if (rarity !== undefined) updateData.rarity = rarity;
    if (product_type !== undefined) updateData.productType = product_type;
    if (grading_company !== undefined) updateData.gradingCompany = grading_company;
    if (grade !== undefined) updateData.grade = grade;
    if (set_name !== undefined) updateData.setName = set_name;
    if (card_number !== undefined) updateData.cardNumber = card_number;
    if (condition !== undefined) updateData.condition = condition;
    if (stock_quantity !== undefined) updateData.stockQuantity = parseInt(stock_quantity);
    if (is_active !== undefined) updateData.isActive = is_active;

    updateData.updatedAt = new Date();

    const card = await PokemonCard.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const formattedCard = {
      id: card._id,
      name: card.name,
      description: card.description,
      price_eth: card.priceEth,
      image_url: card.imageUrl,
      rarity: card.rarity,
      product_type: card.productType,
      grading_company: card.gradingCompany,
      grade: card.grade,
      set_name: card.setName,
      card_number: card.cardNumber,
      condition: card.condition,
      stock_quantity: card.stockQuantity,
      is_active: card.isActive,
      created_at: card.createdAt,
      updated_at: card.updatedAt
    };

    return res.status(200).json(formattedCard);
  } catch (error) {
    console.error('Update card error:', error);
    return res.status(500).json({ error: 'Failed to update card' });
  }
}

async function deleteCard(req, res, id) {
  try {
    // Check if card exists
    const card = await PokemonCard.findById(id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Actually delete the card from database
    await PokemonCard.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ error: 'Failed to delete card' });
  }
}