const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    maxlength: 16,
    default: null
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create truncated username from wallet address
userSchema.pre('save', function(next) {
  if (this.isNew && !this.username) {
    this.username = `${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);