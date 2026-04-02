from app import db
from datetime import datetime

class Receipt(db.Model):
    __tablename__ = 'receipts'

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=False)  
    file_path = db.Column(db.String(255), nullable=False)  # Path to the stored receipt file on the server
    file_name = db.Column(db.String(255), nullable=False)   # Original name of the uploaded file for reference
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Receipt {self.file_name}>'