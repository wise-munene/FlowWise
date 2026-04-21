from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required
from app.utilis.auth import get_current_user


def admin_required(fn):
    @wraps(fn)
    @jwt_required()   #  THIS WAS MISSING
    def wrapper(*args, **kwargs):
        user = get_current_user()

        if not user:
            return jsonify({"error": "Authentication required"}), 401

        if not user.is_admin:
            return jsonify({"error": "Admin access required"}), 403

        return fn(*args, **kwargs)

    return wrapper