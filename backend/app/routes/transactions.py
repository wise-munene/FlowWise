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

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    type_str = data.get('type')
    category = data.get('category')
    amount = data.get('amount')
    date_str = data.get('date')
    notes = data.get('notes', '')
    is_recurring = data.get('is_recurring', False)

    if not type_str or not category or not amount or not date_str:
        return jsonify({'error': 'Type, category, amount and date are required'}), 400

    # ✅ Validate type
    try:
        transaction_type = TransactionType(type_str)
    except ValueError:
        return jsonify({'error': 'Type must be income or expense'}), 400

    # ✅ Validate amount
    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except:
        return jsonify({'error': 'Amount must be a positive number'}), 400

    # ✅ Validate date
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Date must be in YYYY-MM-DD format'}), 400

    transaction = Transaction(
        user_id=user_id,
        type=transaction_type,
        category=category,
        amount=amount,
        date=date,
        notes=notes,
        is_recurring=is_recurring
    )

    db.session.add(transaction)

    # ✅ Budget update
    if transaction_type == TransactionType.expense:
        budget = Budget.query.filter_by(
            user_id=user_id,
            category=category
        ).first()

        if budget:
            budget.spent_amount = float(budget.spent_amount) + amount

    db.session.commit()

    return jsonify({
        'message': 'Transaction created successfully',
        'id': transaction.id
    }), 201


# ================= UPDATE =================
@transactions_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_transaction(id):
    user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404

    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    old_amount = float(transaction.amount)

    if 'category' in data:
        transaction.category = data['category']

    if 'amount' in data:
        try:
            new_amount = float(data['amount'])
            if new_amount <= 0:
                raise ValueError
            transaction.amount = new_amount
        except:
            return jsonify({'error': 'Amount must be positive'}), 400

    if 'date' in data:
        try:
            transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except:
            return jsonify({'error': 'Invalid date format'}), 400

    if 'notes' in data:
        transaction.notes = data['notes']

    if 'is_recurring' in data:
        transaction.is_recurring = data['is_recurring']

    # ✅ Fix budget consistency
    if transaction.type == TransactionType.expense and 'amount' in data:
        budget = Budget.query.filter_by(
            user_id=user_id,
            category=transaction.category
        ).first()

        if budget:
            difference = float(transaction.amount) - old_amount
            budget.spent_amount += difference

    db.session.commit()

    return jsonify({'message': 'Transaction updated successfully'}), 200


# ================= DELETE =================
@transactions_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(id):
    user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404

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

    return jsonify({'message': 'Transaction deleted successfully'}), 200