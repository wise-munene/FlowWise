from app import db
from datetime import datetime

class MpesaAccount(db.Model):
    __tablename__ = 'mpesa_accounts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    account_type = db.Column(db.String(20), nullable=False)
    shortcode = db.Column(db.String(20), nullable=False)
    account_name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'account_type': self.account_type,
            'shortcode': self.shortcode,
            'account_name': self.account_name,
            'is_active': self.is_active,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }