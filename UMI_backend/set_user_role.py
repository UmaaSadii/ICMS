#!/usr/bin/env python
import os
import django
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'UMI_backend.settings')

django.setup()

from register.models import User

def set_user_role():
    try:
        user = User.objects.get(username='testuser')
        user.role = 'admin'  # or 'instructor'
        user.save()
        print(f"Set role for {user.username} to {user.role}")
    except User.DoesNotExist:
        print("User not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    set_user_role()
