from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config  # use config.py for DB URI & secret key
from routes.user_routes import user_routes

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize db and migrations
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(user_routes, url_prefix='/api/users')

    return app