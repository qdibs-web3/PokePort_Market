const mongoose = require('mongoose');

const pokemonCardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  priceEth: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String
  },
  rarity: {
    type: String,
    enum: ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Legendary']
  },
  setName: {
    type: String
  },
  cardNumber: {
    type: String
  },
  condition: {
    type: String,
    enum: ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played']
  },
  stockQuantity: {
    type: Number,
    default: 1,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.PokemonCard || mongoose.model('PokemonCard', pokemonCardSchema);

