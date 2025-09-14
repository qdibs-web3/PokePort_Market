from flask import Blueprint, jsonify, request
from src.models.user import User, db
from datetime import datetime

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/wallet/<wallet_address>', methods=['GET'])
def get_user_by_wallet(wallet_address):
    """Get user by wallet address"""
    user = User.query.filter_by(wallet_address=wallet_address).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@user_bp.route('/users/auth', methods=['POST'])
def authenticate_user():
    """Authenticate or create user with wallet address"""
    data = request.json
    wallet_address = data['wallet_address']
    
    user = User.query.filter_by(wallet_address=wallet_address).first()
    
    if not user:
        # Create new user with truncated wallet address as username
        username = f"{wallet_address[:6]}...{wallet_address[-4:]}"
        user = User(
            wallet_address=wallet_address,
            username=username,
            email=data.get('email'),
            last_login=datetime.utcnow()
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
    
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.email = data.get('email', user.email)
    user.is_admin = data.get('is_admin', user.is_admin)
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
