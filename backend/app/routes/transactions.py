from flask import Blueprint, request, jsonify
from app import db
from app.models.transaction import Transaction, TransactionType
from app.models.budget import Budget
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__)


# ================= GET =================
@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()

    transactions = Transaction.query.filter_by(user_id=user_id)\
        .order_by(Transaction.created_at.desc())\
        .all()

    return jsonify([{
        'id': t.id,
        'type': t.type.value,
        'category': t.category,
        'payment_method': t.payment_method,
        'amount': float(t.amount),
        'date': t.date.strftime('%Y-%m-%d'),
        'notes': t.notes,
        'is_recurring': t.is_recurring,
        'created_at': t.created_at.strftime('%Y-%m-%d %H:%M:%S')
    } for t in transactions]), 200


# ================= CREATE =================
@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def create_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()

    type_str = data.get('type')
    category = data.get('category')
    amount = float(data.get('amount'))
    date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
    notes = data.get('notes', '')
    is_recurring = data.get('is_recurring', False)
    payment_method = data.get('payment_method', 'Mpesa')
    payment_channel = data.get('payment_channel', 'manual')
    till_number = data.get('till_number')
    paybill_number = data.get('paybill_number')
    account_reference = data.get('account_reference')

    transaction_type = TransactionType(type_str)

    transaction = Transaction(
        user_id=user_id,
        type=transaction_type,
        category=category,
        payment_method=payment_method,
        payment_channel=payment_channel,
        till_number=till_number,
        paybill_number=paybill_number,
        account_reference=account_reference,
        amount=amount,
        date=date,
        notes=notes,
        is_recurring=is_recurring
    )

    db.session.add(transaction)

    # ✅ DIRECT MATCH (NO MAPPING)
    if transaction_type == TransactionType.expense:
        budget = Budget.query.filter_by(
            user_id=user_id,
            category=category
        ).first()

        if budget:
            budget.spent_amount = float(budget.spent_amount) + amount

    db.session.commit()

    return jsonify({'message': 'Transaction created', 'id': transaction.id}), 201


# ================= UPDATE =================
@transactions_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_transaction(id):
    user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

    old_amount = float(transaction.amount)

    data = request.get_json()

    if 'category' in data:
        transaction.category = data['category']

    if 'amount' in data:
        transaction.amount = float(data['amount'])

    if 'date' in data:
        transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()

    if 'notes' in data:
        transaction.notes = data['notes']

    # ✅ FIX BUDGET
    if transaction.type == TransactionType.expense:
        budget = Budget.query.filter_by(
            user_id=user_id,
            category=transaction.category
        ).first()

        if budget:
            difference = float(transaction.amount) - old_amount
            budget.spent_amount += difference

    db.session.commit()

    return jsonify({'message': 'Transaction updated'}), 200


# ================= DELETE =================
@transactions_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(id):
    user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

    if transaction.type == TransactionType.expense:
        budget = Budget.query.filter_by(
            user_id=user_id,
            category=transaction.category
        ).first()

        if budget:
            budget.spent_amount = max(
                0,
                float(budget.spent_amount) - float(transaction.amount)
            )

    db.session.delete(transaction)
    db.session.commit()

    return jsonify({'message': 'Transaction deleted'}), 200
