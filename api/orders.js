const connectToDatabase = require('./_lib/mongodb');
const Order = require('./_models/Order');
const User = require('./_models/User');
const PokemonCard = require('./_models/PokemonCard');

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
        return await getOrders(req, res);
      case 'POST':
        return await createOrder(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Orders API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function getOrders(req, res) {
  try {
    const { user_id, status, page = 1, per_page = 20 } = req.query;
    const pageNum = parseInt(page);
    const perPage = parseInt(per_page);
    const skip = (pageNum - 1) * perPage;

    let query = {};

    if (user_id) {
      query.userId = user_id;
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'username walletAddress')
      .populate('cardId')
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / perPage);

    // Format orders to match frontend expectations
    const formattedOrders = orders.map(order => ({
      id: order._id,
      user_id: order.userId?._id,
      card_id: order.cardId?._id,
      quantity: order.quantity,
      total_price_eth: order.totalPriceEth,
      transaction_hash: order.transactionHash,
      status: order.status,
      buyer_wallet_address: order.buyerWalletAddress,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      user: order.userId ? {
        id: order.userId._id,
        username: order.userId.username,
        wallet_address: order.userId.walletAddress
      } : null,
      card: order.cardId ? {
        id: order.cardId._id,
        name: order.cardId.name,
        description: order.cardId.description,
        price_eth: order.cardId.priceEth,
        image_url: order.cardId.imageUrl,
        rarity: order.cardId.rarity,
        set_name: order.cardId.setName,
        card_number: order.cardId.cardNumber,
        condition: order.cardId.condition,
        stock_quantity: order.cardId.stockQuantity,
        is_active: order.cardId.isActive
      } : null
    }));

    return res.status(200).json({
      orders: formattedOrders,
      total,
      pages,
      current_page: pageNum
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

async function createOrder(req, res) {
  try {
    const { card_id, quantity = 1, buyer_wallet_address } = req.body;

    if (!card_id || !buyer_wallet_address) {
      return res.status(400).json({ error: 'Card ID and wallet address are required' });
    }

    // Validate card availability
    const card = await PokemonCard.findById(card_id);
    if (!card || !card.isActive || card.stockQuantity < quantity) {
      return res.status(400).json({ error: 'Card not available or insufficient stock' });
    }

    // Get or create user
    let user = await User.findOne({ walletAddress: buyer_wallet_address.toLowerCase() });
    if (!user) {
      const username = `${buyer_wallet_address.slice(0, 6)}...${buyer_wallet_address.slice(-4)}`;
      user = new User({
        walletAddress: buyer_wallet_address.toLowerCase(),
        username,
        lastLogin: new Date()
      });
      await user.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    const totalPrice = card.priceEth * quantity;

    // Create order
    const order = new Order({
      userId: user._id,
      cardId: card._id,
      quantity,
      totalPriceEth: totalPrice,
      buyerWalletAddress: buyer_wallet_address.toLowerCase(),
      status: 'pending'
    });

    await order.save();

    // NOTE: Stock will be deducted when payment is confirmed, not here
    // This prevents inventory locking without payment

    // Populate the order for response
    await order.populate('userId', 'username walletAddress');
    await order.populate('cardId');

    const formattedOrder = {
      id: order._id,
      user_id: order.userId._id,
      card_id: order.cardId._id,
      quantity: order.quantity,
      total_price_eth: order.totalPriceEth,
      transaction_hash: order.transactionHash,
      status: order.status,
      buyer_wallet_address: order.buyerWalletAddress,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      user: {
        id: order.userId._id,
        username: order.userId.username,
        wallet_address: order.userId.walletAddress
      },
      card: {
        id: order.cardId._id,
        name: order.cardId.name,
        description: order.cardId.description,
        price_eth: order.cardId.priceEth,
        image_url: order.cardId.imageUrl,
        rarity: order.cardId.rarity,
        set_name: order.cardId.setName,
        card_number: order.cardId.cardNumber,
        condition: order.cardId.condition,
        stock_quantity: order.cardId.stockQuantity,
        is_active: order.cardId.isActive
      }
    };

    return res.status(201).json(formattedOrder);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}
