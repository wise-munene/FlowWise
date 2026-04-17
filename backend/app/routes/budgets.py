from flask import Blueprint, request, jsonify
from app import db
from app.models.budget import Budget, BudgetPeriod
from flask_jwt_extended import jwt_required, get_jwt_identity

budgets_bp = Blueprint('budgets', __name__)

@budgets_bp.route('/', methods=['GET'])
@jwt_required()
def get_budgets():
    user_id = get_jwt_identity()
    budgets = Budget.query.filter_by(user_id=user_id).all()

    return jsonify([{
        'id': b.id,
        'category': b.category,
        'budget_amount': float(b.budget_amount),
        'spent_amount': float(b.spent_amount),
        'period': b.period.value,
        'alert_threshold': float(b.alert_threshold),
        'percentage_used': b.percentage_used(),
        'is_exceeded': b.is_exceeded(),
        'is_near_limit': b.is_near_limit(),
        'created_at': b.created_at.strftime('%Y-%m-%d %H:%M:%S')
    } for b in budgets]), 200

@budgets_bp.route('/', methods=['POST'])
@jwt_required()
def create_budget():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    category = data.get('category')
    budget_amount = data.get('budget_amount')
    period_str = data.get('period', 'monthly')
    alert_threshold = data.get('alert_threshold', 0.80)

    if not category or not budget_amount:
        return jsonify({'error': 'Category and budget amount are required'}), 400

    existing = Budget.query.filter_by(user_id=user_id, category=category).first()
    if existing:
        return jsonify({'error': f'Budget for {category} already exists'}), 409

    try:
        period = BudgetPeriod(period_str)
    except ValueError:
        return jsonify({'error': 'Period must be monthly or yearly'}), 400

    # calculate existing spending for this category
    from app.models.transaction import Transaction, TransactionType

    transactions = Transaction.query.filter_by(
    user_id=user_id,
    type=TransactionType.expense
).all()
    existing_spending = sum(
    float(t.amount)
    for t in transactions
    if t.category == category
)

    budget = Budget(
        user_id=user_id,
        category=category,
        budget_amount=budget_amount,
        spent_amount=existing_spending,
        period=period,
        alert_threshold=alert_threshold
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({
        'message': 'Budget created successfully',
        'id': budget.id,
        'spent_amount': float(existing_spending)
    }), 201

@budgets_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_budget(id):
    user_id = get_jwt_identity()
    budget = Budget.query.filter_by(id=id, user_id=user_id).first()

    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    data = request.get_json()

    if 'category' in data:
        budget.category = data['category']

    if 'budget_amount' in data:
        budget.budget_amount = data['budget_amount']
    if 'alert_threshold' in data:
        budget.alert_threshold = data['alert_threshold']
    if 'period' in data:
        try:
            budget.period = BudgetPeriod(data['period'])
        except ValueError:
            return jsonify({'error': 'Period must be monthly or yearly'}), 400

    db.session.commit()

    return jsonify({
        'message': 'Budget updated successfully',
        'is_exceeded': budget.is_exceeded(),
        'is_near_limit': budget.is_near_limit(),
        'percentage_used': budget.percentage_used()
    }), 200


@budgets_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_budget(id):
    user_id = get_jwt_identity()
    budget = Budget.query.filter_by(id=id, user_id=user_id).first()

    if not budget:
        return jsonify({'error': 'Budget not found'}), 404

    db.session.delete(budget)
    db.session.commit()

    return jsonify({'message': 'Budget deleted successfully'}), 200


@budgets_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():  #get alerts when the user is approaching or has exceeded their budget limits
    user_id = get_jwt_identity()
    budgets = Budget.query.filter_by(user_id=user_id).all()

    alerts = []
    for b in budgets:
        if b.is_exceeded():
            alerts.append({  # Add an alert for exceeded budgets with category, status, message, budget amount and spent amount
                'category': b.category,
                'status': 'exceeded',
                'message': f'{b.category} budget exceeded — spent {b.percentage_used()}%',
                'budget_amount': float(b.budget_amount),
                'spent_amount': float(b.spent_amount)
            })
        elif b.is_near_limit():  # Add an alert for budgets that are approaching the limit with category, status, message, budget amount and spent amount
            alerts.append({
                'category': b.category,
                'status': 'warning',
                'message': f'{b.category} budget at {b.percentage_used()}% — approaching limit',
                'budget_amount': float(b.budget_amount),
                'spent_amount': float(b.spent_amount)
            })

    return jsonify({'alerts': alerts, 'count': len(alerts)}), 200