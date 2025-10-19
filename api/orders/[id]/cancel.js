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

    // Extract ID from URL path
    let id = req.query.id;
    if (!id && req.url) {
      const match = req.url.match(/\/api\/orders\/([^/]+)\/cancel/);
      if (match && match[1]) {
        id = match[1];
      }
    }

    const order = await Order.findById(id)
      .populate('userId', 'username walletAddress')
      .populate('cardId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Only pending orders can be cancelled' 
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Note: No need to restore stock since it was never deducted for pending orders

    return res.status(200).json({ 
      message: 'Order cancelled successfully',
      order: {
        id: order._id,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
};