from config import Config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

db       = SQLAlchemy()
migrate  = Migrate()
jwt      = JWTManager()
mail     = Mail()
limiter  = Limiter(key_func=get_remote_address, default_limits=[])


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)

    # FIX SEC-04: CORS reads allowed origin from env var, not hardcoded localhost
    allowed_origins = app.config.get('FRONTEND_URL', 'http://localhost:5173')
    CORS(
        app,
        resources={r'/api/*': {'origins': allowed_origins}},
        supports_credentials=True,
    )

    @app.route('/api/health')
    def health_check():
        return {'status': 'ok'}, 200

    from .models import User, Transaction, Budget, Receipt
    from .models.reset_token import PasswordResetToken

    from .routes import auth_bp, transactions_bp, budgets_bp, reports_bp, mpesa_bp, admin_bp

    app.register_blueprint(auth_bp,          url_prefix='/api/auth')
    app.register_blueprint(transactions_bp,  url_prefix='/api/transactions')
    app.register_blueprint(budgets_bp,       url_prefix='/api/budgets')
    app.register_blueprint(reports_bp,       url_prefix='/api/reports')
    app.register_blueprint(mpesa_bp,         url_prefix='/api/mpesa')
    app.register_blueprint(admin_bp,         url_prefix='/api')

    return app
