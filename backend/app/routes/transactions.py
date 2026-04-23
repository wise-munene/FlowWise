from flask import Blueprint, request, jsonify
from app import db
from app.models.transaction import Transaction, TransactionType
from app.models.budget import Budget
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

transactions_bp = Blueprint('transactions', __name__)


# ================= GET (with pagination) =================
@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id  = get_jwt_identity()
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)

    pagination = (
        Transaction.query
        .filter_by(user_id=user_id)
        .order_by(Transaction.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        'transactions': [{
            'id': t.id,
            'type': t.type.value,
            'category': t.category,
            'payment_method': t.payment_method,
            'amount': float(t.amount),
            'date': t.date.strftime('%Y-%m-%d'),
            'notes': t.notes,
            'is_recurring': t.is_recurring,
            'created_at': t.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        } for t in pagination.items],
        'total':    pagination.total,
        'page':     pagination.page,
        'pages':    pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    }), 200


# ================= CREATE =================
@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def create_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # -- Validation --
    type_str = data.get('type', '')
    if type_str not in ('income', 'expense'):
        return jsonify({'error': 'type must be income or expense'}), 400

    category = data.get('category', '').strip()
    if not category:
        return jsonify({'error': 'category is required'}), 400
    if len(category) > 50:
        return jsonify({'error': 'category must be 50 characters or fewer'}), 400

    try:
        amount = float(data.get('amount'))
        if amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'error': 'amount must be a positive number'}), 400

    try:
        date = datetime.strptime(data.get('date', ''), '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'date must be YYYY-MM-DD format'}), 400

    notes             = data.get('notes', '')
    is_recurring      = data.get('is_recurring', False)
    payment_method    = data.get('payment_method', 'Mpesa')
    payment_channel   = data.get('payment_channel', 'manual')
    till_number       = data.get('till_number')
    paybill_number    = data.get('paybill_number')
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
        is_recurring=is_recurring,
    )
    db.session.add(transaction)

    if transaction_type == TransactionType.expense:
        budget = Budget.query.filter_by(user_id=user_id, category=category).first()
        if budget:
            budget.spent_amount = float(budget.spent_amount) + amount

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error, please try again'}), 500

    return jsonify({'message': 'Transaction created', 'id': transaction.id}), 201


# ================= UPDATE =================
@transactions_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_transaction(id):
    user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

    # FIX BUG-01: null guard BEFORE any attribute access
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # FIX BUG-02: snapshot OLD values before ANY mutation
    old_category = transaction.category
    old_amount   = float(transaction.amount)
    old_type     = transaction.type

    new_category = data.get('category', old_category).strip()
    new_amount   = float(data.get('amount', old_amount))
    new_type_str = data.get('type', old_type.value)

    # Validation
    if 'amount' in data:
        try:
            if float(data['amount']) <= 0:
                return jsonify({'error': 'amount must be positive'}), 400
        except (TypeError, ValueError):
            return jsonify({'error': 'amount must be a number'}), 400

    if 'category' in data and len(new_category) > 50:
        return jsonify({'error': 'category must be 50 characters or fewer'}), 400

    if 'type' in data and new_type_str not in ('income', 'expense'):
        return jsonify({'error': 'type must be income or expense'}), 400

    # Apply mutations
    transaction.category = new_category
    transaction.amount   = new_amount
    transaction.type     = TransactionType(new_type_str)

    if 'date' in data:
        try:
            transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'date must be YYYY-MM-DD format'}), 400

    if 'notes' in data:
        transaction.notes = data['notes']

    # FIX BUG-02: reverse the OLD budget, then apply to the NEW budget
    if old_type == TransactionType.expense:
        old_budget = Budget.query.filter_by(user_id=user_id, category=old_category).first()
        if old_budget:
            old_budget.spent_amount = max(0.0, float(old_budget.spent_amount) - old_amount)

    if transaction.type == TransactionType.expense:
        new_budget = Budget.query.filter_by(user_id=user_id, category=new_category).first()
        if new_budget:
            new_budget.spent_amount = float(new_budget.spent_amount) + new_amount

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error, please try again'}), 500

    return jsonify({'message': 'Transaction updated'}), 200


# ================= DELETE =================
@transactions_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(id):
    user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

    # FIX BUG-01: null guard
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404

    if transaction.type == TransactionType.expense:
        budget = Budget.query.filter_by(user_id=user_id, category=transaction.category).first()
        if budget:
            budget.spent_amount = max(0.0, float(budget.spent_amount) - float(transaction.amount))

    db.session.delete(transaction)

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error, please try again'}), 500

    return jsonify({'message': 'Transaction deleted'}), 200