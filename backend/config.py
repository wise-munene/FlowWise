import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    # =========================
    # CORE SETTINGS
    # =========================
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fallback-jwt-secret')

    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
         SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # =========================
    # JWT SETTINGS
    # =========================
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # =========================
    # MAIL SETTINGS
    # =========================
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

    # =========================
    # FRONTEND URL
    # =========================
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    # =========================
    # M-PESA SETTINGS
    # =========================
    MPESA_CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY')
    MPESA_CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET')
    MPESA_SHORTCODE = os.getenv('MPESA_SHORTCODE')
    MPESA_PASSKEY = os.getenv('MPESA_PASSKEY')
    MPESA_CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL')
    MPESA_ENV = os.getenv('MPESA_ENV', 'sandbox')