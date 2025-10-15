import os
import django
import sys

# Add the project directory to the Python path
sys.path.append('UMI_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'UMI_backend.settings')

# Setup Django
django.setup()

from students.models import Student

def check_students():
    students = Student.objects.all()
    print(f'Total students: {students.count()}')
    for s in students[:10]:
        print(f'ID: {s.student_id}, Name: "{s.name}", Dept: {s.department.code if s.department else None}')

if __name__ == '__main__':
    check_students()
