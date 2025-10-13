const connectToDatabase = require('../../_lib/mongodb');
const Order = require('../../_models/Order');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accept both PUT and PATCH methods
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Check multiple places for the ID (params, query, body)
    const id = req.query.id || req.params?.id || req.body.id;
    const { status } = req.body;

    console.log('Order status update request:', { id, status, query: req.query, params: req.params });

    if (!id) {
      return res.status(400).json({ 
        error: 'Order ID is required',
        debug: { query: req.query, params: req.params, body: req.body }
      });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'username walletAddress')
     .populate('cardId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Format response to match frontend expectations
    const formattedOrder = {
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
        price_eth: order.cardId.priceEth
      } : null
    };

    return res.status(200).json(formattedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
};