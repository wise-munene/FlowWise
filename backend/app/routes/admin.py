from flask import Blueprint, jsonify, request
from app.models import User, Transaction
from app import db
from app.utilis.admin import admin_required
from sqlalchemy.exc import SQLAlchemyError

admin_bp = Blueprint('admin', __name__)

VALID_TIERS = ('free', 'basic', 'premium')


# ── Stats ────────────────────────────────────────────────────────────

@admin_bp.route('/admin/stats')
@admin_required
def get_stats():
    from datetime import datetime, timedelta
    month_ago = datetime.utcnow() - timedelta(days=30)

    return jsonify({
        'total_users':        User.query.count(),
        'free_users':         User.query.filter_by(tier='free').count(),
        'basic_users':        User.query.filter_by(tier='basic').count(),
        'premium_users':      User.query.filter_by(tier='premium').count(),
        'new_users':          User.query.filter(User.created_at >= month_ago).count(),
        'total_transactions': Transaction.query.count(),
    })


# ── Users list ───────────────────────────────────────────────────────

@admin_bp.route('/admin/users')
@admin_required
def get_users():
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 15, type=int), 100)
    search   = request.args.get('search', '').strip()
    tier_f   = request.args.get('tier', '')

    query = User.query
    if search:
        query = query.filter(
            (User.name.ilike(f'%{search}%')) | (User.email.ilike(f'%{search}%'))
        )
    if tier_f in VALID_TIERS:
        query = query.filter_by(tier=tier_f)

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'users': [{
            'id':           u.id,
            'name':         u.name,
            'email':        u.email,
            'tier':         u.tier,
            'account_type': u.account_type,
            'is_admin':     u.is_admin,
            'created_at':   u.created_at.isoformat() if u.created_at else None,
        } for u in pagination.items],
        'pagination': {
            'total':    pagination.total,
            'pages':    pagination.pages,
            'page':     pagination.page,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        },
    })


# ── Set tier (FIX BUG-07) ────────────────────────────────────────────

@admin_bp.route('/admin/set-tier', methods=['POST'])
@admin_required
def set_tier():
    data = request.json or {}
    user_id = data.get('user_id')
    tier    = data.get('tier')

    if not user_id or tier not in VALID_TIERS:
        return jsonify({'error': f'user_id and tier ({", ".join(VALID_TIERS)}) are required'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.tier       = tier
    user.is_premium = tier in ('basic', 'premium')

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    return jsonify({'message': f'Tier updated to {tier}', 'user_id': user.id, 'tier': user.tier})


# ── Set admin (FIX BUG-07) ───────────────────────────────────────────

@admin_bp.route('/admin/set-admin', methods=['POST'])
@admin_required
def set_admin():
    data     = request.json or {}
    user_id  = data.get('user_id')
    is_admin = data.get('is_admin')

    if user_id is None or is_admin is None:
        return jsonify({'error': 'user_id and is_admin are required'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.is_admin = bool(is_admin)

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    return jsonify({'message': 'Admin status updated', 'is_admin': user.is_admin})


# ── Legacy set-premium (kept for backward compat) ────────────────────

@admin_bp.route('/admin/set-premium', methods=['POST'])
@admin_required
def set_premium():
    data = request.json or {}
    if 'user_id' not in data or 'is_premium' not in data:
        return jsonify({'error': 'user_id and is_premium are required'}), 400

    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.is_premium = bool(data['is_premium'])
    user.tier       = 'premium' if user.is_premium else 'free'
    db.session.commit()
    return jsonify({'message': 'Updated'})
