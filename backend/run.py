"""
Main Flask Application Entry Point
Run with: python run.py
"""
import os
from app import create_app

if __name__ == '__main__':
    config_name = os.getenv('FLASK_ENV', 'development')
    app = create_app(config_name)
    
    @app.route('/')
    def home():
        return "Backend Running..."
    
    # Run the Flask development server
    print("\n" + "="*50)
    print("Placement Trend Analyzer Backend API")
    print("="*50)
    print(f"Environment: {config_name}")
    print("Endpoints:")
    print("  - POST   /api/auth/login")
    print("  - GET    /api/student/profile")
    print("  - GET    /api/analytics/placement/yearwise")
    print("  - GET    /api/analytics/placement/branchwise")
    print("  - GET    /api/analytics/skills/top")
    print("  - GET    /api/tpo/profile")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
