const mongoose = require('mongoose');
const connectToDatabase = require('./lib/mongodb');
const User = require('./models/User');
const PokemonCard = require('./models/PokemonCard');

const sampleCards = [
  {
    name: 'Charizard',
    description: 'A powerful Fire/Flying-type Pokémon. This rare holographic card features stunning artwork.',
    priceEth: 0.5,
    imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    rarity: 'Rare',
    setName: 'Base Set',
    cardNumber: '4/102',
    condition: 'Near Mint',
    stockQuantity: 3
  },
  {
    name: 'Pikachu',
    description: 'The iconic Electric-type Pokémon that started it all. A must-have for any collection.',
    priceEth: 0.15,
    imageUrl: 'https://images.pokemontcg.io/base1/58_hires.png',
    rarity: 'Common',
    setName: 'Base Set',
    cardNumber: '58/102',
    condition: 'Mint',
    stockQuantity: 10
  },
  {
    name: 'Blastoise',
    description: 'A mighty Water-type Pokémon with powerful hydro cannons. Holographic rare card.',
    priceEth: 0.4,
    imageUrl: 'https://images.pokemontcg.io/base1/2_hires.png',
    rarity: 'Rare',
    setName: 'Base Set',
    cardNumber: '2/102',
    condition: 'Near Mint',
    stockQuantity: 2
  },
  {
    name: 'Venusaur',
    description: 'A Grass/Poison-type Pokémon with incredible plant-based powers. Rare holographic.',
    priceEth: 0.35,
    imageUrl: 'https://images.pokemontcg.io/base1/15_hires.png',
    rarity: 'Rare',
    setName: 'Base Set',
    cardNumber: '15/102',
    condition: 'Lightly Played',
    stockQuantity: 1
  },
  {
    name: 'Mewtwo',
    description: 'The legendary Psychic-type Pokémon created through genetic manipulation. Ultra rare.',
    priceEth: 1.2,
    imageUrl: 'https://images.pokemontcg.io/base1/10_hires.png',
    rarity: 'Ultra Rare',
    setName: 'Base Set',
    cardNumber: '10/102',
    condition: 'Mint',
    stockQuantity: 1
  },
  {
    name: 'Squirtle',
    description: 'A cute Water-type turtle Pokémon. Perfect starter card for new collectors.',
    priceEth: 0.08,
    imageUrl: 'https://images.pokemontcg.io/base1/63_hires.png',
    rarity: 'Common',
    setName: 'Base Set',
    cardNumber: '63/102',
    condition: 'Near Mint',
    stockQuantity: 15
  },
  {
    name: 'Charmander',
    description: 'The Fire-type lizard Pokémon that evolves into the mighty Charizard.',
    priceEth: 0.12,
    imageUrl: 'https://images.pokemontcg.io/base1/46_hires.png',
    rarity: 'Common',
    setName: 'Base Set',
    cardNumber: '46/102',
    condition: 'Mint',
    stockQuantity: 8
  },
  {
    name: 'Bulbasaur',
    description: 'The Grass/Poison-type seed Pokémon. Number 001 in the Pokédex.',
    priceEth: 0.1,
    imageUrl: 'https://images.pokemontcg.io/base1/44_hires.png',
    rarity: 'Common',
    setName: 'Base Set',
    cardNumber: '44/102',
    condition: 'Near Mint',
    stockQuantity: 12
  }
];

async function seedDatabase() {
  try {
    await connectToDatabase();
    
    // Create admin user
    const adminWallet = '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A';
    let adminUser = await User.findOne({ walletAddress: adminWallet.toLowerCase() });
    
    if (!adminUser) {
      adminUser = new User({
        walletAddress: adminWallet.toLowerCase(),
        username: '0x742d...5Da5A',
        isAdmin: true
      });
      await adminUser.save();
      console.log('Admin user created');
    }

    // Add sample cards
    for (const cardData of sampleCards) {
      const existingCard = await PokemonCard.findOne({ 
        name: cardData.name, 
        setName: cardData.setName 
      });
      
      if (!existingCard) {
        const card = new PokemonCard(cardData);
        await card.save();
      }
    }

    console.log('Database seeded successfully!');
    console.log(`Added ${sampleCards.length} Pokemon cards`);
    console.log('Admin user wallet:', adminWallet);
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

