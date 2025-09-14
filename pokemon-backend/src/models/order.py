from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('pokemon_card.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    total_price_eth = db.Column(db.Float, nullable=False)
    transaction_hash = db.Column(db.String(66))  # Ethereum transaction hash
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, shipped, delivered, cancelled
    buyer_wallet_address = db.Column(db.String(42), nullable=False)  # Ethereum wallet address
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('orders', lazy=True))
    card = db.relationship('PokemonCard', backref=db.backref('orders', lazy=True))

    def __repr__(self):
        return f'<Order {self.id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'card_id': self.card_id,
            'quantity': self.quantity,
            'total_price_eth': self.total_price_eth,
            'transaction_hash': self.transaction_hash,
            'status': self.status,
            'buyer_wallet_address': self.buyer_wallet_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'card': self.card.to_dict() if self.card else None,
            'user': self.user.to_dict() if self.user else None
        }

