import os
from ninja.security import HttpBearer
from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib.auth.models import User
from django.conf import settings

# Hardcoded for now, but ideally moved to settings/env
GOOGLE_CLIENT_ID = "937760292124-iifkr9bnc1gjrrg8na1paijnp36l5ia9.apps.googleusercontent.com"

class GoogleAuthBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            # Verify the token with Google
            # clock_skew allows for some server time differences
            id_info = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10
            )

            # Extract user info
            email = id_info.get('email')
            if not email:
                return None
            
            # Get or create the user in Django
            # Using email as username is common for OAuth
            user, created = User.objects.get_or_create(
                username=email,
                defaults={'email': email, 'first_name': id_info.get('given_name', ''), 'last_name': id_info.get('family_name', '')}
            )

            return user
        except ValueError as e:
            # Invalid token
            return None
        except Exception as e:
            # General failure
            print(f"Auth failed: {e}")
            return None
