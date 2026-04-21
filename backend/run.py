from app import create_app
import os
from flask_migrate import upgrade
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = create_app()

with app.app_context():
    try:
        upgrade()
        print("✅ Database migrated")
    except Exception as e:
        print("Migration error:", e)


if __name__ == '__main__':
    env = os.getenv("FLASK_ENV", "development")
    app.run(debug=(env == "development"))