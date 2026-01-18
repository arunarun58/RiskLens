# File: risklens/urls.py
from django.urls import path
from api.api import api

urlpatterns = [
    path('api/', api.urls),
]
