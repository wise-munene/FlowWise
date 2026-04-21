from flask import Blueprint, jsonify, request
from app.models import User, Transaction
from app import db
from app.utilis.admin import admin_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/admin/users')
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([
        {
            "id": u.id,
            "email": u.email,
            "is_premium": u.is_premium,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat() if u.created_at else None
        } for u in users
    ])


@admin_bp.route('/admin/stats')
@admin_required
def get_stats():
    return jsonify({
        "total_users": User.query.count(),
        "premium_users": User.query.filter_by(is_premium=True).count(),
        "total_transactions": Transaction.query.count()
    })


@admin_bp.route('/admin/set-premium', methods=['POST'])
@admin_required
def set_premium():
    data = request.json
    if not data or 'user_id' not in data or 'is_premium' not in data:
        return jsonify({"error": "user_id and is_premium are required"}), 400

    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user.is_premium = data['is_premium']

    db.session.commit()

    return jsonify({"message": "updated"})
