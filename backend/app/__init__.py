"""
Flask Application Factory
Initializes Flask app with all configurations and blueprints
"""
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient
from config import config
import os

jwt = JWTManager()
mongo_client = None
db = None

def create_app(config_name='development'):
    """
    Application factory function
    Args:
        config_name: Configuration environment (development/production)
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    
    # Initialize MongoDB
    global mongo_client, db
    mongo_client = MongoClient(app.config['MONGODB_URI'])
    db = mongo_client[app.config['DB_NAME']]
    
    # Store db in app context
    app.mongo_db = db
    
    # Register blueprints
    from app.auth.routes import auth_bp
    from app.student.routes import student_bp
    from app.analytics.routes import analytics_bp
    from app.tpo.routes import tpo_bp
    from app.skillgap.routes import skillgap_bp
    from app.microplan.routes import microplan_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(tpo_bp)
    app.register_blueprint(skillgap_bp)
    app.register_blueprint(microplan_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'Backend API is running', 'version': '1.0.0'}, 200
    
    return app
