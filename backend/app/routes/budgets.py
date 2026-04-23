from flask import Blueprint, request, jsonify
from app import db
from app.models.budget import Budget, BudgetPeriod
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError

budgets_bp = Blueprint('budgets', __name__)


def _budget_dict(b):
    return {
        'id':               b.id,
        'category':         b.category,
        'budget_amount':    float(b.budget_amount),
        'spent_amount':     float(b.spent_amount),
        'period':           b.period.value,
        'alert_threshold':  float(b.alert_threshold),
        'percentage_used':  b.percentage_used(),
        'is_exceeded':      b.is_exceeded(),
        'is_near_limit':    b.is_near_limit(),
        'period_start':     b.period_start.isoformat() if b.period_start else None,
        'created_at':       b.created_at.strftime('%Y-%m-%d %H:%M:%S'),
    }


@budgets_bp.route('/', methods=['GET'])
@jwt_required()
def get_budgets():
    user_id = get_jwt_identity()
    budgets = Budget.query.filter_by(user_id=user_id).all()

    # FIX BUG-08: reset any budget whose period has rolled over
    needs_commit = False
    for b in budgets:
        if b.reset_if_new_period():
            needs_commit = True
    if needs_commit:
        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()

    return jsonify([_budget_dict(b) for b in budgets]), 200


@budgets_bp.route('/', methods=['POST'])
@jwt_required()
def create_budget():
    user_id = get_jwt_identity()
    data    = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    category       = (data.get('category') or '').strip()
    budget_amount  = data.get('budget_amount')
    period_str     = data.get('period', 'monthly')
    alert_threshold = float(data.get('alert_threshold', 0.80))

    if not category:
        return jsonify({'error': 'category is required'}), 400
    if len(category) > 50:
        return jsonify({'error': 'category must be 50 characters or fewer'}), 400
    try:
        budget_amount = float(budget_amount)
        if budget_amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'error': 'budget_amount must be a positive number'}), 400
    if period_str not in ('monthly', 'yearly'):
        return jsonify({'error': 'period must be monthly or yearly'}), 400
    if not (0.0 < alert_threshold <= 1.0):
        return jsonify({'error': 'alert_threshold must be between 0 and 1'}), 400

    if Budget.query.filter_by(user_id=user_id, category=category).first():
        return jsonify({'error': f'Budget for {category} already exists'}), 409

    from app.models.transaction import Transaction, TransactionType
    from datetime import date

    period     = BudgetPeriod(period_str)
    period_start = date.today().replace(day=1) if period_str == 'monthly' else date.today().replace(month=1, day=1)

    # Sum existing spending for this category within the current period
    existing_spending = sum(
        float(t.amount)
        for t in Transaction.query.filter_by(user_id=user_id, type=TransactionType.expense).all()
        if t.category == category and t.date >= period_start
    )

    budget = Budget(
        user_id=user_id,
        category=category,
        budget_amount=budget_amount,
        spent_amount=existing_spending,
        period=period,
        alert_threshold=alert_threshold,
        period_start=period_start,
    )
    db.session.add(budget)

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error, please try again'}), 500

    return jsonify({'message': 'Budget created', 'id': budget.id, 'spent_amount': existing_spending}), 201


@budgets_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_budget(id):
    user_id = get_jwt_identity()
    budget  = Budget.query.filter_by(id=id, user_id=user_id).first()

    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    data = request.get_json() or {}

    if 'budget_amount' in data:
        try:
            amt = float(data['budget_amount'])
            if amt <= 0:
                raise ValueError
            budget.budget_amount = amt
        except (TypeError, ValueError):
            return jsonify({'error': 'budget_amount must be a positive number'}), 400

    if 'alert_threshold' in data:
        try:
            t = float(data['alert_threshold'])
            if not (0.0 < t <= 1.0):
                raise ValueError
            budget.alert_threshold = t
        except (TypeError, ValueError):
            return jsonify({'error': 'alert_threshold must be between 0 and 1'}), 400

    if 'period' in data:
        if data['period'] not in ('monthly', 'yearly'):
            return jsonify({'error': 'period must be monthly or yearly'}), 400
        budget.period = BudgetPeriod(data['period'])

    if 'category' in data:
        new_cat = data['category'].strip()
        if len(new_cat) > 50:
            return jsonify({'error': 'category must be 50 characters or fewer'}), 400
        budget.category = new_cat

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error, please try again'}), 500

    return jsonify(_budget_dict(budget)), 200


@budgets_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_budget(id):
    user_id = get_jwt_identity()
    budget  = Budget.query.filter_by(id=id, user_id=user_id).first()

    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    db.session.delete(budget)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error, please try again'}), 500

    return jsonify({'message': 'Budget deleted'}), 200


@budgets_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    user_id = get_jwt_identity()
    budgets = Budget.query.filter_by(user_id=user_id).all()

    alerts = []
    for b in budgets:
        b.reset_if_new_period()
        if b.is_exceeded():
            alerts.append({
                'category':      b.category,
                'status':        'exceeded',
                'message':       f'{b.category} budget exceeded — spent {b.percentage_used()}%',
                'budget_amount': float(b.budget_amount),
                'spent_amount':  float(b.spent_amount),
            })
        elif b.is_near_limit():
            alerts.append({
                'category':      b.category,
                'status':        'warning',
                'message':       f'{b.category} budget at {b.percentage_used()}% — approaching limit',
                'budget_amount': float(b.budget_amount),
                'spent_amount':  float(b.spent_amount),
            })

    return jsonify({'alerts': alerts, 'count': len(alerts)}), 200
