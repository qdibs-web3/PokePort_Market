const connectToDatabase = require('../_lib/mongodb');
const User = require('../_models/User');
const { checkAndUnlockBadges } = require('../_lib/badge-logic');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Missing walletAddress' });
    }

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Trigger badge check
    await checkAndUnlockBadges(user);

    // Fetch fresh user to get updated badges
    const updatedUser = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    return res.status(200).json({ 
      success: true, 
      badges: updatedUser.badges || []
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return res.status(500).json({ error: 'Failed to check badges' });
  }
};