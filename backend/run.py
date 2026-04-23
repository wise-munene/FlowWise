from app import create_app
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = create_app()

if __name__ == '__main__':
    env = os.getenv('FLASK_ENV', 'development')
    app.run(debug=(env == 'development'))




