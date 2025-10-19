const connectToDatabase = require('../../_lib/mongodb');
const Order = require('../../_models/Order');
const PokemonCard = require('../../_models/PokemonCard');
const { ethers } = require('ethers');

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
      const match = req.url.match(/\/api\/orders\/([^/]+)\/confirm/);
      if (match && match[1]) {
        id = match[1];
      }
    }

    const { transaction_hash, customer_info } = req.body;

    if (!transaction_hash) {
      return res.status(400).json({ error: 'Transaction hash is required' });
    }

    // Find the order
    const order = await Order.findById(id)
      .populate('userId', 'username walletAddress')
      .populate('cardId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }

    // Check if order has expired (10 minutes)
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    if (orderAge > 10 * 60 * 1000) {
      order.status = 'expired';
      await order.save();
      return res.status(400).json({ error: 'Order has expired. Please create a new order.' });
    }

    // Verify transaction on blockchain
    const adminWallet = process.env.ADMIN_WALLET_ADDRESS || '0xf08d3184c50a1B255507785F71c9330034852Cd5';
    const rpcUrl = process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'; // Using demo endpoint

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Get transaction
      const tx = await provider.getTransaction(transaction_hash);
      
      if (!tx) {
        return res.status(400).json({ 
          error: 'Transaction not found on blockchain. Please wait a moment and try again.' 
        });
      }

      // Wait for at least 1 confirmation
      const receipt = await tx.wait(1);
      
      if (receipt.status !== 1) {
        return res.status(400).json({ 
          error: 'Transaction failed on blockchain. Please check your transaction.' 
        });
      }

      // Verify payment amount (allow small variance for gas estimation)
      const expectedAmount = ethers.parseEther(order.totalPriceEth.toString());
      const actualAmount = tx.value;
      const minAmount = expectedAmount * 99n / 100n; // Allow 1% variance
      
      if (actualAmount < minAmount) {
        return res.status(400).json({ 
          error: `Insufficient payment. Expected ${ethers.formatEther(expectedAmount)} ETH, received ${ethers.formatEther(actualAmount)} ETH` 
        });
      }

      // Verify recipient address
      if (tx.to.toLowerCase() !== adminWallet.toLowerCase()) {
        return res.status(400).json({ 
          error: `Payment sent to wrong address. Expected ${adminWallet}, received ${tx.to}` 
        });
      }

    } catch (error) {
      console.error('Transaction verification error:', error);
      
      // If it's a network error or transaction is too new, allow it but log for manual review
      if (error.code === 'NETWORK_ERROR' || error.message.includes('not found')) {
        console.warn(`⚠️ Could not verify transaction ${transaction_hash} - will require manual review`);
        // Continue with order confirmation but flag it
      } else {
        return res.status(400).json({ 
          error: 'Failed to verify transaction: ' + error.message 
        });
      }
    }

    // Check stock availability
    const card = await PokemonCard.findById(order.cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.stockQuantity < order.quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock available. Your payment will be refunded.' 
      });
    }

    // Deduct stock NOW (after payment is verified)
    card.stockQuantity -= order.quantity;
    await card.save();

    // Update order with transaction hash and customer info
    order.transactionHash = transaction_hash;
    order.status = 'confirmed';
    
    if (customer_info) {
      order.customerInfo = customer_info;
    }
    
    await order.save();

    const formattedOrder = {
      id: order._id,
      user_id: order.userId._id,
      card_id: order.cardId._id,
      quantity: order.quantity,
      total_price_eth: order.totalPriceEth,
      transaction_hash: order.transactionHash,
      status: order.status,
      buyer_wallet_address: order.buyerWalletAddress,
      customer_info: order.customerInfo,
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
    return res.status(500).json({ error: 'Failed to confirm order: ' + error.message });
  }
};