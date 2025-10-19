const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PokemonCard',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  totalPriceEth: {
    type: Number,
    required: true,
    min: 0
  },
  transactionHash: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'expired'],
    default: 'pending'
  },
  customerInfo: {
    type: Object,
    default: {}
  },
  buyerWalletAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from creation
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);