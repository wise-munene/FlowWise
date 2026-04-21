from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'error': 'Missing fields'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Email already exists'}), 400

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    user = User(
        name=name,
        email=email,
        password_hash=password_hash
    )

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))  

    return jsonify({
        'access_token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'account_type': user.account_type,
            'is_admin': user.is_admin,
            'is_premium': user.is_premium
        }
    }), 200


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.id))  # ✅ FIX

    return jsonify({
        'access_token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'is_admin': user.is_admin,
            'is_premium': user.is_premium,
            'account_type': user.account_type
        }
    })