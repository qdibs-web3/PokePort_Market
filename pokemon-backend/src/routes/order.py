from flask import Blueprint, jsonify, request
from src.models.order import Order
from src.models.pokemon_card import PokemonCard
from src.models.user import User, db
from datetime import datetime

order_bp = Blueprint('order', __name__)

@order_bp.route('/orders', methods=['GET'])
def get_orders():
    """Get orders (admin can see all, users see their own)"""
    user_id = request.args.get('user_id', type=int)
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = Order.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    if status:
        query = query.filter_by(status=status)
    
    orders = query.order_by(Order.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'orders': [order.to_dict() for order in orders.items],
        'total': orders.total,
        'pages': orders.pages,
        'current_page': page
    })

@order_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Get a specific order"""
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict())

@order_bp.route('/orders', methods=['POST'])
def create_order():
    """Create a new order"""
    data = request.json
    
    # Validate card availability
    card = PokemonCard.query.get_or_404(data['card_id'])
    if not card.is_active or card.stock_quantity < data.get('quantity', 1):
        return jsonify({'error': 'Card not available or insufficient stock'}), 400
    
    # Get or create user based on wallet address
    wallet_address = data['buyer_wallet_address']
    user = User.query.filter_by(wallet_address=wallet_address).first()
    
    if not user:
        # Create truncated username from wallet address
        username = f"{wallet_address[:6]}...{wallet_address[-4:]}"
        user = User(
            wallet_address=wallet_address,
            username=username,
            last_login=datetime.utcnow()
        )
        db.session.add(user)
        db.session.flush()  # Get the user ID
    else:
        user.last_login = datetime.utcnow()
    
    quantity = data.get('quantity', 1)
    total_price = card.price_eth * quantity
    
    order = Order(
        user_id=user.id,
        card_id=data['card_id'],
        quantity=quantity,
        total_price_eth=total_price,
        buyer_wallet_address=wallet_address,
        status='pending'
    )
    
    # Update card stock
    card.stock_quantity -= quantity
    
    db.session.add(order)
    db.session.commit()
    
    return jsonify(order.to_dict()), 201

@order_bp.route('/orders/<int:order_id>/confirm', methods=['POST'])
def confirm_order(order_id):
    """Confirm order with transaction hash"""
    order = Order.query.get_or_404(order_id)
    data = request.json
    
    order.transaction_hash = data['transaction_hash']
    order.status = 'confirmed'
    
    db.session.commit()
    return jsonify(order.to_dict())

@order_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status (admin only)"""
    order = Order.query.get_or_404(order_id)
    data = request.json
    
    valid_statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    new_status = data.get('status')
    
    if new_status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    # If cancelling, restore stock
    if new_status == 'cancelled' and order.status != 'cancelled':
        card = PokemonCard.query.get(order.card_id)
        if card:
            card.stock_quantity += order.quantity
    
    order.status = new_status
    db.session.commit()
    
    return jsonify(order.to_dict())

@order_bp.route('/orders/user/<wallet_address>', methods=['GET'])
def get_user_orders(wallet_address):
    """Get orders for a specific wallet address"""
    user = User.query.filter_by(wallet_address=wallet_address).first()
    if not user:
        return jsonify({'orders': [], 'total': 0})
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    orders = Order.query.filter_by(user_id=user.id).order_by(
        Order.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'orders': [order.to_dict() for order in orders.items],
        'total': orders.total,
        'pages': orders.pages,
        'current_page': page
    })

