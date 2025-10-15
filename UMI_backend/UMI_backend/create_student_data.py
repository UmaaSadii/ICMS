import os
import django

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'UMI_backend.settings')
django.setup()

from academics.models import Department, Semester, Course, Attendance, Result, Fee
from django.contrib.auth import get_user_model
from datetime import date

User = get_user_model()

# Step 1: Get student
student = User.objects.filter(username='shameer').first()
if not student:
    print("❌ Student not found. Pehle student register karo.")
    exit()
else:
    print(f"✅ Found student: {student.username}")

# Step 2: Create Department
dept, _ = Department.objects.get_or_create(
    name="Computer Science",
    defaults={
        "code": "CS",
        "description": "BSCS Department",
        "num_semesters": 8
    }
)
print("✅ Department created or exists:", dept.name)

# Step 3: Create Semester
semester, _ = Semester.objects.get_or_create(
    name="Semester 1",
    department=dept,
    defaults={
        "semester_code": "SEM1",
        "program": "BSCS",
        "capacity": 30
    }
)
print("✅ Semester created or exists:", semester.name)

# Step 4: Create Course
course, _ = Course.objects.get_or_create(
    name="Introduction to Programming",
    department=dept,
    semester=semester,
    defaults={
        "code": "CS101",
        "credits": 3,
        "description": "Basic Programming Course"
    }
)
print("✅ Course created or exists:", course.name)

# Step 5: Create Attendance
Attendance.objects.get_or_create(
    student=student,
    course=course,
    date=date.today(),
    defaults={"status": "Present"}
)
print("✅ Attendance added.")

# Step 6: Create Result
Result.objects.get_or_create(
    student=student,
    course=course,
    exam_type="Mid",
    defaults={
        "obtained_marks": 35,
        "total_marks": 50,
        "grade": "A"
    }
)
print("✅ Result added.")

# Step 7: Create Fee
Fee.objects.get_or_create(
    student=student,
    department=dept,
    semester=semester,
    defaults={
        "total_amount": 20000,
        "amount_paid": 10000
    }
)
print("✅ Fee record added.")

print("\n🎉 All academic data for student created successfully!")