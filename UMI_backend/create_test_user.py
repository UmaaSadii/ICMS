#!/usr/bin/env python
import os
import django
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'UMI_backend.settings')

django.setup()

from register.models import User

def create_test_user():
    try:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_staff=True
        )
        print(f"Created test user: {user.username}")
    except Exception as e:
        print(f"Error creating user: {e}")

if __name__ == '__main__':
    create_test_user()
