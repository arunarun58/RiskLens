#!/bin/bash
# File: setup_and_test.sh
# Complete setup and test script for RiskLens

set -e

echo "=== RiskLens Setup and Test Script ==="
echo

# Create all necessary Python files
echo "Creating project structure..."

# Create risklens/__init__.py
cat > risklens/__init__.py << 'EOF'
from .celery import app as celery_app

__all__ = ('celery_app',)
EOF

# Create risklens/settings.py
cat > risklens/settings.py << 'EOF'
# File: risklens/settings.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-dev-key-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'ninja',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'risklens.urls'

WSGI_APPLICATION = 'risklens.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Celery Configuration
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
EOF

# Create risklens/celery.py
cat > risklens/celery.py << 'EOF'
# File: risklens/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'risklens.settings')

app = Celery('risklens')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
EOF

# Create risklens/urls.py
cat > risklens/urls.py << 'EOF'
# File: risklens/urls.py
from django.urls import path
from api.api import api

urlpatterns = [
    path('api/', api.urls),
]
EOF

# Create risklens/wsgi.py
cat > risklens/wsgi.py << 'EOF'
# File: risklens/wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'risklens.settings')

application = get_wsgi_application()
EOF

# Create api/__init__.py
touch api/__init__.py

# Create api/apps.py
cat > api/apps.py << 'EOF'
# File: api/apps.py
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
EOF

echo "✓ Project structure created"
echo

# Run migrations
echo "Running Django migrations..."
./venv/bin/python manage.py migrate
echo "✓ Migrations complete"
echo

# Create test script
cat > test_api.py << 'TESTEOF'
#!/usr/bin/env python
# File: test_api.py
"""
Test script for RiskLens API
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'risklens.settings')
django.setup()

from api.models import Portfolio, PortfolioPosition
from api.risk_engine import RiskCalculator

def test_risk_calculation():
    """Test the risk calculation engine"""
    print("=" * 60)
    print("TESTING RISKLENS RISK CALCULATION ENGINE")
    print("=" * 60)
    print()
    
    # Create sample portfolio
    print("📊 Creating sample portfolio...")
    portfolio = Portfolio(positions=[
        PortfolioPosition(ticker="AAPL", quantity=100, asset_class="Equity"),
        PortfolioPosition(ticker="MSFT", quantity=50, asset_class="Equity"),
        PortfolioPosition(ticker="GOOGL", quantity=30, asset_class="Equity"),
    ])
    print(f"   - {len(portfolio.positions)} positions")
    for pos in portfolio.positions:
        print(f"     • {pos.ticker}: {pos.quantity} shares")
    print()
    
    # Calculate risk
    print("🔬 Calculating risk metrics...")
    try:
        calculator = RiskCalculator()
        result = calculator.calculate_risk(portfolio)
        
        print("✅ Risk calculation successful!")
        print()
        print("=" * 60)
        print("RESULTS")
        print("=" * 60)
        print()
        print(f"💰 Total Portfolio Value: ${result.total_value:,.2f}")
        print(f"📈 Annualized Volatility: {result.volatility_annualized*100:.2f}%")
        print(f"⚠️  Value at Risk (95%): ${result.var_95:,.2f}")
        print()
        
        print("📋 Position Breakdown:")
        print("-" * 60)
        for pos in result.positions:
            print(f"\n{pos['ticker']}:")
            print(f"  Value: ${pos['value']:,.2f} ({pos['weight']*100:.1f}% of portfolio)")
            print(f"  Volatility: {pos['volatility']*100:.1f}%")
            print(f"  Risk Contribution: {pos['risk_contribution_pct']:.1f}%")
        print()
        
        print("=" * 60)
        print("EXPLANATION")
        print("=" * 60)
        print()
        print(result.explanation.summary)
        print()
        print("Top Risk Drivers:")
        for driver in result.explanation.top_drivers:
            print(f"  • {driver.name}: {driver.contribution_pct:.1f}%")
        print()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_risk_calculation()
    exit(0 if success else 1)
TESTEOF

chmod +x test_api.py

echo "Running comprehensive test..."
echo
./venv/bin/python test_api.py

echo
echo "=== Setup and Test Complete ==="
EOF

chmod +x setup_and_test.sh
