from flask import Blueprint, jsonify, request
from src.models.pokemon_card import PokemonCard
from src.models.user import db

pokemon_card_bp = Blueprint('pokemon_card', __name__)

@pokemon_card_bp.route('/cards', methods=['GET'])
def get_cards():
    """Get all active Pokemon cards"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    rarity = request.args.get('rarity')
    set_name = request.args.get('set_name')
    
    query = PokemonCard.query.filter_by(is_active=True)
    
    if rarity:
        query = query.filter_by(rarity=rarity)
    if set_name:
        query = query.filter_by(set_name=set_name)
    
    cards = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'cards': [card.to_dict() for card in cards.items],
        'total': cards.total,
        'pages': cards.pages,
        'current_page': page
    })

@pokemon_card_bp.route('/cards/<int:card_id>', methods=['GET'])
def get_card(card_id):
    """Get a specific Pokemon card"""
    card = PokemonCard.query.get_or_404(card_id)
    return jsonify(card.to_dict())

@pokemon_card_bp.route('/cards', methods=['POST'])
def create_card():
    """Create a new Pokemon card (admin only)"""
    data = request.json
    
    card = PokemonCard(
        name=data['name'],
        description=data.get('description'),
        price_eth=data['price_eth'],
        image_url=data.get('image_url'),
        rarity=data.get('rarity'),
        set_name=data.get('set_name'),
        card_number=data.get('card_number'),
        condition=data.get('condition'),
        stock_quantity=data.get('stock_quantity', 1)
    )
    
    db.session.add(card)
    db.session.commit()
    return jsonify(card.to_dict()), 201

@pokemon_card_bp.route('/cards/<int:card_id>', methods=['PUT'])
def update_card(card_id):
    """Update a Pokemon card (admin only)"""
    card = PokemonCard.query.get_or_404(card_id)
    data = request.json
    
    card.name = data.get('name', card.name)
    card.description = data.get('description', card.description)
    card.price_eth = data.get('price_eth', card.price_eth)
    card.image_url = data.get('image_url', card.image_url)
    card.rarity = data.get('rarity', card.rarity)
    card.set_name = data.get('set_name', card.set_name)
    card.card_number = data.get('card_number', card.card_number)
    card.condition = data.get('condition', card.condition)
    card.stock_quantity = data.get('stock_quantity', card.stock_quantity)
    card.is_active = data.get('is_active', card.is_active)
    
    db.session.commit()
    return jsonify(card.to_dict())

@pokemon_card_bp.route('/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    """Delete a Pokemon card (admin only)"""
    card = PokemonCard.query.get_or_404(card_id)
    card.is_active = False  # Soft delete
    db.session.commit()
    return '', 204

@pokemon_card_bp.route('/cards/search', methods=['GET'])
def search_cards():
    """Search Pokemon cards by name"""
    query = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    if not query:
        return jsonify({'cards': [], 'total': 0, 'pages': 0, 'current_page': page})
    
    cards = PokemonCard.query.filter(
        PokemonCard.name.contains(query),
        PokemonCard.is_active == True
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'cards': [card.to_dict() for card in cards.items],
        'total': cards.total,
        'pages': cards.pages,
        'current_page': page
    })

