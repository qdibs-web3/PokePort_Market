from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class PokemonCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price_eth = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(255))
    rarity = db.Column(db.String(50))  # Common, Uncommon, Rare, Ultra Rare, etc.
    set_name = db.Column(db.String(100))
    card_number = db.Column(db.String(20))
    condition = db.Column(db.String(50))  # Mint, Near Mint, Lightly Played, etc.
    stock_quantity = db.Column(db.Integer, default=1)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<PokemonCard {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price_eth': self.price_eth,
            'image_url': self.image_url,
            'rarity': self.rarity,
            'set_name': self.set_name,
            'card_number': self.card_number,
            'condition': self.condition,
            'stock_quantity': self.stock_quantity,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

