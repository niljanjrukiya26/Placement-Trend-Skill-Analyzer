"""WSGI entrypoint for Placement Management backend."""

import os

from flask_cors import CORS

from app import create_app


config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)
CORS(app)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
