from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from flask_mail import Message
from app.models.reset_token import PasswordResetToken
from app import mail
import os

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()
password_reset_tokens = {}  # In-memory store for password reset tokens (for demo purposes)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    account_type = data.get('account_type', 'personal')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        account_type=account_type
    )

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Account created successfully',
        'access_token': access_token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'account_type': str(user.account_type)
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'account_type': str(user.account_type)  # Convert Enum to string for JSON serialization
        }
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'message': 'If this email exists you will receive a reset link'}), 200

    token = PasswordResetToken.generate(user.id)
    reset_link = f'http://localhost:5173/reset-password?token={token}'

    msg = Message(
        subject='Reset your FlowWise password',
        sender=os.getenv('MAIL_USERNAME'),
        recipients=[email],
        body=f'Hi {user.name},\n\nClick this link to reset your password:\n\n{reset_link}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.\n\nThe FlowWise Team'
    )

    try:
        mail.send(msg)
        return jsonify({'message': 'If this email exists you will receive a reset link'}), 200
    except Exception as e:
        print(f'MAIL ERROR: {e}')
        return jsonify({'error': 'Failed to send email'}), 500
    
    
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token_str = data.get('token')
    new_password = data.get('password')

    if not token_str or not new_password:
        return jsonify({'error': 'Token and password are required'}), 400

    reset_token = PasswordResetToken.query.filter_by(token=token_str).first()

    if not reset_token or not reset_token.is_valid():
        return jsonify({'error': 'Invalid or expired reset link. Please request a new one.'}), 400

    user = User.query.get(reset_token.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    reset_token.used = True
    db.session.commit()

    return jsonify({'message': 'Password reset successfully'}), 200