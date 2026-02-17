"""
Configuration module for Flask application
Handles database connections and Flask settings
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
    JWT_ALGORITHM = 'HS256'
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    DB_NAME = os.getenv('DB_NAME', 'placement_analyzer')
    
    # API Configuration
    JSON_SORT_KEYS = False
    CORS_ORIGINS = "*"

class DevelopmentConfig(Config):
    """Development environment config"""
    FLASK_ENV = 'development'
    DEBUG = True

class ProductionConfig(Config):
    """Production environment config"""
    FLASK_ENV = 'production'
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
