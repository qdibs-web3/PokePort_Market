const connectToDatabase = require('../_lib/mongodb');
const User = require('../_models/User');

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

    const { wallet_address, email } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Find existing user or create new one
    let user = await User.findOne({ walletAddress: wallet_address.toLowerCase() });

    if (!user) {
      // Create new user
      const username = `${wallet_address.slice(0, 6)}...${wallet_address.slice(-4)}`;
      user = new User({
        walletAddress: wallet_address.toLowerCase(),
        username,
        email,
        lastLogin: new Date()
      });
      await user.save();
    } else {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    }

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
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};