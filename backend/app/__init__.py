from config import Config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)


    

    db.init_app(app)


    @app.route('/api/health')
    def health_check():
        return {"status": "ok"}, 200

    migrate.init_app(app, db)
    jwt.init_app(app)

    CORS(
    app,
    origins=[app.config.get("FRONTEND_URL")],
    supports_credentials=True
)
    mail.init_app(app)

    from .models import User, Transaction, Budget, Receipt
    from .models.reset_token import PasswordResetToken

    from .routes import auth_bp, transactions_bp, budgets_bp, reports_bp, mpesa_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(budgets_bp, url_prefix='/api/budgets')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(mpesa_bp, url_prefix='/api/mpesa')

    return app
