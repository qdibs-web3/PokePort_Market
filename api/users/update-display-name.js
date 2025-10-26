const connectToDatabase = require('../_lib/mongodb');
const User = require('../_models/User');

// Simple profanity filter (basic implementation)
const containsProfanity = (text) => {
  const profanityList = [
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'cunt', 'dick', 'pussy', 'cock',
    'nigger', 'nigga', 'faggot', 'fag', 'retard', 'whore', 'slut', 'bastard'
  ];
  
  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
};

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

    const { wallet_address, display_name } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    if (!display_name) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    // Validate display name length
    if (display_name.length > 16) {
      return res.status(400).json({ error: 'Display name must be 16 characters or less' });
    }

    // Check for profanity
    if (containsProfanity(display_name)) {
      return res.status(400).json({ error: 'Display name contains inappropriate content' });
    }

    // Find and update user
    const user = await User.findOne({ walletAddress: wallet_address.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.displayName = display_name;
    await user.save();

    // Format response to match frontend expectations
    const formattedUser = {
      id: user._id,
      wallet_address: user.walletAddress,
      username: user.username,
      display_name: user.displayName,
      email: user.email,
      is_admin: user.isAdmin,
      created_at: user.createdAt,
      last_login: user.lastLogin
    };

    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error('Update display name error:', error);
    return res.status(500).json({ error: 'Failed to update display name' });
  }
};