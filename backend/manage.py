#!/usr/bin/env python
# File: manage.py
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # Load environment variables from .env
    try:
        import dotenv
        from pathlib import Path
        env_path = Path(__file__).resolve().parent / '.env'
        dotenv.load_dotenv(env_path)
    except ImportError:
        print("Warning: python-dotenv not installed, .env file not loaded.")

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'risklens.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
