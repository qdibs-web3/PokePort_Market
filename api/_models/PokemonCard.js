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
    type: String  // Keep for backward compatibility
  },
  imageUrls: {
    type: [String],  // New field for multiple images
    default: []
  },
  rarity: {
    type: String,
    enum: {
      values: ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Legendary', ''],
      message: '{VALUE} is not a valid rarity'
    },
    default: ''
  },
  productType: {
    type: String,
    enum: ['Card', 'Graded Card', 'Sealed', 'Custom'],
    default: 'Card'
  },
  gradingCompany: {
    type: String
  },
  grade: {
    type: String
  },
  setName: {
    type: String
  },
  cardNumber: {
    type: String
  },
  condition: {
    type: String,
    enum: {
      values: ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', ''],
      message: '{VALUE} is not a valid condition'
    },
    default: ''
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

// Virtual to get all images (backward compatibility)
pokemonCardSchema.virtual('allImages').get(function() {
  const images = [...this.imageUrls];
  if (this.imageUrl && !images.includes(this.imageUrl)) {
    images.unshift(this.imageUrl);
  }
  return images.filter(Boolean);
});

module.exports = mongoose.models.PokemonCard || mongoose.model('PokemonCard', pokemonCardSchema);