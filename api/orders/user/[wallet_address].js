const connectToDatabase = require('../../_lib/mongodb');
const Order = require('../../_models/Order');
const User = require('../../_models/User');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    console.log('User orders endpoint - req.query:', req.query);
    console.log('User orders endpoint - req.params:', req.params);
    
    // Get wallet_address from either query or params
    const wallet_address = req.query.wallet_address || req.params?.wallet_address;
    const { page = 1, per_page = 20 } = req.query;
    
    if (!wallet_address) {
      console.log('ERROR: wallet_address is undefined!');
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    console.log('Using wallet_address:', wallet_address);
    
    const pageNum = parseInt(page);
    const perPage = parseInt(per_page);
    const skip = (pageNum - 1) * perPage;

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: wallet_address.toLowerCase() });
    
    if (!user) {
      return res.status(200).json({
        orders: [],
        total: 0,
        pages: 0,
        current_page: pageNum
      });
    }

    // Get user's orders
    const orders = await Order.find({ userId: user._id })
      .populate('userId', 'username walletAddress')
      .populate('cardId')
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ userId: user._id });
    const pages = Math.ceil(total / perPage);

    // Format orders to match frontend expectations
    const formattedOrders = orders.map(order => ({
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
    console.error('Get user orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch user orders' });
  }
};