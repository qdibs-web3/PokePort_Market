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

    // Extract wallet_address from URL path - try multiple methods
    let wallet_address = req.query.wallet_address;
    
    // If not in query, try to extract from URL
    if (!wallet_address && req.url) {
      const match = req.url.match(/\/api\/orders\/user\/([^/?]+)/);
      if (match && match[1]) {
        wallet_address = match[1];
      }
    }
    
    const { page = 1, per_page = 20 } = req.query;
    
    if (!wallet_address) {
      console.error('ERROR: wallet_address is undefined!');
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    const pageNum = parseInt(page);
    const perPage = parseInt(per_page);
    const skip = (pageNum - 1) * perPage;

    // Find user by wallet address (case-insensitive)
    const user = await User.findOne({ walletAddress: wallet_address.toLowerCase() });
    
    if (!user) {
      // User not found - return empty orders instead of error
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
    const formattedOrders = orders.map(order => {
      // Handle cases where populated fields might be null
      const userInfo = order.userId ? {
        id: order.userId._id,
        username: order.userId.username || 'Unknown',
        wallet_address: order.userId.walletAddress || ''
      } : {
        id: null,
        username: 'Unknown',
        wallet_address: ''
      };

      const cardInfo = order.cardId ? {
        id: order.cardId._id,
        name: order.cardId.name || 'Unknown Card',
        description: order.cardId.description || '',
        price_eth: order.cardId.priceEth || 0,
        image_url: order.cardId.imageUrl || '',
        rarity: order.cardId.rarity || '',
        set_name: order.cardId.setName || '',
        card_number: order.cardId.cardNumber || '',
        condition: order.cardId.condition || '',
        stock_quantity: order.cardId.stockQuantity || 0,
        is_active: order.cardId.isActive !== undefined ? order.cardId.isActive : true
      } : null;

      return {
        id: order._id,
        user_id: order.userId?._id || null,
        card_id: order.cardId?._id || null,
        quantity: order.quantity || 1,
        total_price_eth: order.totalPriceEth || 0,
        transaction_hash: order.transactionHash || '',
        status: order.status || 'pending',
        buyer_wallet_address: order.buyerWalletAddress || '',
        customer_info: order.customerInfo || null,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        user: userInfo,
        card: cardInfo
      };
    });

    return res.status(200).json({
      orders: formattedOrders,
      total,
      pages,
      current_page: pageNum
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch user orders',
      details: error.message 
    });
  }
};