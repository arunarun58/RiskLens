# File: risklens/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'risklens.settings')

app = Celery('risklens')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
