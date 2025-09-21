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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { id } = req.query;
    const { transaction_hash } = req.body;

    if (!transaction_hash) {
      return res.status(400).json({ error: 'Transaction hash is required' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        transactionHash: transaction_hash,
        status: 'confirmed'
      },
      { new: true }
    ).populate('userId', 'username walletAddress').populate('cardId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

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

    return res.status(200).json(formattedOrder);
  } catch (error) {
    console.error('Confirm order error:', error);
    return res.status(500).json({ error: 'Failed to confirm order' });
  }
};

