import re
from flask import Blueprint, request, jsonify
from app import db, mail, limiter
from app.models import User
from app.models.reset_token import PasswordResetToken
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from flask_mail import Message
from sqlalchemy.exc import SQLAlchemyError

auth_bp = Blueprint('auth', __name__)
bcrypt  = Bcrypt()

EMAIL_RE   = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
MIN_PW_LEN = 8


def _user_payload(user):
    return {
        'id':           user.id,
        'name':         user.name,
        'email':        user.email,
        'account_type': user.account_type,
        'is_admin':     user.is_admin,
        'is_premium':   user.is_premium,
    }


# ── Signup ──────────────────────────────────────────────────────────

@auth_bp.route('/signup', methods=['POST'])
@limiter.limit('5 per minute')
def signup():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name         = (data.get('name') or '').strip()
    email        = (data.get('email') or '').strip().lower()
    password     = data.get('password') or ''
    account_type = data.get('account_type', 'personal')

    # Validation
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    if len(name) > 100:
        return jsonify({'error': 'Name must be 100 characters or fewer'}), 400
    if not email or not EMAIL_RE.match(email):
        return jsonify({'error': 'A valid email address is required'}), 400
    if len(email) > 100:
        return jsonify({'error': 'Email must be 100 characters or fewer'}), 400
    if len(password) < MIN_PW_LEN:
        return jsonify({'error': f'Password must be at least {MIN_PW_LEN} characters'}), 400
    if account_type not in ('personal', 'business'):
        return jsonify({'error': 'account_type must be personal or business'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 400

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(name=name, email=email, password_hash=password_hash, account_type=account_type)

    db.session.add(user)
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Could not create account, please try again'}), 500

    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token, 'user': _user_payload(user)}), 200


# ── Login ────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
@limiter.limit('10 per minute')
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': token, 'user': _user_payload(user)}), 200


# ── Forgot Password ──────────────────────────────────────────────────

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit('3 per minute')
def forgot_password():
    data  = request.get_json()
    email = (data.get('email') or '').strip().lower()

    # Always return the same message to prevent user enumeration
    generic = 'If that email exists you will receive a reset link shortly.'

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': generic}), 200

    token = PasswordResetToken.generate(user.id)

    import os
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    reset_link   = f'{frontend_url}/reset-password/{token}'

    try:
        msg = Message(
            subject='FlowWise — Reset your password',
            sender=os.getenv('MAIL_USERNAME'),
            recipients=[user.email],
            body=f'Hi {user.name},\n\nClick the link below to reset your password (valid for 1 hour):\n\n{reset_link}\n\nIf you did not request this, ignore this email.',
        )
        mail.send(msg)
    except Exception as e:
        print(f'Mail error: {e}')

    return jsonify({'message': generic}), 200


# ── Reset Password ───────────────────────────────────────────────────

@auth_bp.route('/reset-password/<token>', methods=['POST'])
@limiter.limit('5 per minute')
def reset_password(token):
    data        = request.get_json()
    new_password = data.get('password') or ''

    if len(new_password) < MIN_PW_LEN:
        return jsonify({'error': f'Password must be at least {MIN_PW_LEN} characters'}), 400

    reset_token = PasswordResetToken.query.filter_by(token=token).first()
    if not reset_token or not reset_token.is_valid():
        return jsonify({'error': 'This reset link is invalid or has expired'}), 400

    user = User.query.get(reset_token.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    reset_token.used   = True

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Could not update password, please try again'}), 500

    return jsonify({'message': 'Password updated successfully'}), 200

