from app import db 
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name= db.Column(db.String(100), nullable=False)
    email= db.Column(db.String(100), unique=True, nullable=False)
    password_hash= db.Column(db.String(128), nullable=False)
    account_type= db.Column(db.String(20), nullable=False, default='personal')  #whether it is a personal or business account
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    is_premium = db.Column(db.Boolean, default=False)

    transactions = db.relationship('Transaction', backref='user', lazy=True)
    budgets = db.relationship('Budget', backref='user', lazy=True)


    def __repr__(self):
        return f'<User {self.email}>'   # Representation of the User object for debugging purposes.