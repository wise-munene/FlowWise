from app import db
from datetime import datetime
import enum


class TransactionType(enum.Enum):  # Enum to represent the type of transaction, either income or expense.
    income = 'income'
    expense = 'expense'


class Transaction(db.Model):
    __tablename__ ='transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.Enum(TransactionType), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)  # Storing monetary values with 2 decimal places
    date = db.Column(db.Date,nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)   # text is unlimited in comparison to string which has a limit 
    is_recurring = db.Column(db.Boolean, default=False) # Indicates whether the transaction is recurring (e.g., monthly subscription)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    receipt = db.relationship('Receipt', backref='transaction', uselist=False)

    def __repr__(self):
        return f'<Transaction {self.type} {self.amount}>'
