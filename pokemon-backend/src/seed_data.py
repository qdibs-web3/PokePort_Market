#!/usr/bin/env python3
"""
Seed script to populate the database with sample Pokemon cards
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from src.models.pokemon_card import PokemonCard
from src.main import app

def seed_database():
    with app.app_context():
        # Create admin user
        admin_user = User.query.filter_by(wallet_address='0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A').first()
        if not admin_user:
            admin_user = User(
                wallet_address='0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A',
                username='0x742d...5Da5A',
                is_admin=True
            )
            db.session.add(admin_user)

        # Sample Pokemon cards
        sample_cards = [
            {
                'name': 'Charizard',
                'description': 'A powerful Fire/Flying-type Pokémon. This rare holographic card features stunning artwork.',
                'price_eth': 0.5,
                'image_url': 'https://images.pokemontcg.io/base1/4_hires.png',
                'rarity': 'Rare',
                'set_name': 'Base Set',
                'card_number': '4/102',
                'condition': 'Near Mint',
                'stock_quantity': 3
            },
            {
                'name': 'Pikachu',
                'description': 'The iconic Electric-type Pokémon that started it all. A must-have for any collection.',
                'price_eth': 0.15,
                'image_url': 'https://images.pokemontcg.io/base1/58_hires.png',
                'rarity': 'Common',
                'set_name': 'Base Set',
                'card_number': '58/102',
                'condition': 'Mint',
                'stock_quantity': 10
            },
            {
                'name': 'Blastoise',
                'description': 'A mighty Water-type Pokémon with powerful hydro cannons. Holographic rare card.',
                'price_eth': 0.4,
                'image_url': 'https://images.pokemontcg.io/base1/2_hires.png',
                'rarity': 'Rare',
                'set_name': 'Base Set',
                'card_number': '2/102',
                'condition': 'Near Mint',
                'stock_quantity': 2
            },
            {
                'name': 'Venusaur',
                'description': 'A Grass/Poison-type Pokémon with incredible plant-based powers. Rare holographic.',
                'price_eth': 0.35,
                'image_url': 'https://images.pokemontcg.io/base1/15_hires.png',
                'rarity': 'Rare',
                'set_name': 'Base Set',
                'card_number': '15/102',
                'condition': 'Lightly Played',
                'stock_quantity': 1
            },
            {
                'name': 'Mewtwo',
                'description': 'The legendary Psychic-type Pokémon created through genetic manipulation. Ultra rare.',
                'price_eth': 1.2,
                'image_url': 'https://images.pokemontcg.io/base1/10_hires.png',
                'rarity': 'Ultra Rare',
                'set_name': 'Base Set',
                'card_number': '10/102',
                'condition': 'Mint',
                'stock_quantity': 1
            },
            {
                'name': 'Squirtle',
                'description': 'A cute Water-type turtle Pokémon. Perfect starter card for new collectors.',
                'price_eth': 0.08,
                'image_url': 'https://images.pokemontcg.io/base1/63_hires.png',
                'rarity': 'Common',
                'set_name': 'Base Set',
                'card_number': '63/102',
                'condition': 'Near Mint',
                'stock_quantity': 15
            },
            {
                'name': 'Charmander',
                'description': 'The Fire-type lizard Pokémon that evolves into the mighty Charizard.',
                'price_eth': 0.12,
                'image_url': 'https://images.pokemontcg.io/base1/46_hires.png',
                'rarity': 'Common',
                'set_name': 'Base Set',
                'card_number': '46/102',
                'condition': 'Mint',
                'stock_quantity': 8
            },
            {
                'name': 'Bulbasaur',
                'description': 'The Grass/Poison-type seed Pokémon. Number 001 in the Pokédex.',
                'price_eth': 0.1,
                'image_url': 'https://images.pokemontcg.io/base1/44_hires.png',
                'rarity': 'Common',
                'set_name': 'Base Set',
                'card_number': '44/102',
                'condition': 'Near Mint',
                'stock_quantity': 12
            }
        ]

        # Add cards to database
        for card_data in sample_cards:
            existing_card = PokemonCard.query.filter_by(name=card_data['name'], set_name=card_data['set_name']).first()
            if not existing_card:
                card = PokemonCard(**card_data)
                db.session.add(card)

        db.session.commit()
        print("Database seeded successfully!")
        print(f"Added {len(sample_cards)} Pokemon cards")
        print("Admin user created with wallet: 0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A")

if __name__ == '__main__':
    seed_database()

