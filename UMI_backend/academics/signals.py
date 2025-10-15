from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.db.models import Avg, Q, Sum
from .models import Attendance, Result, Fee, FeeStructure, Scholarship
from students.models import Student
from datetime import date, timedelta

# GPA calculate
def compute_gpa(student):
    pts = []
    for r in student.results.all():
        pct = r.percentage
        if pct >= 85: pts.append(4.0)
        elif pct >= 75: pts.append(3.5)
        elif pct >= 65: pts.append(3.0)
        elif pct >= 55: pts.append(2.5)
        elif pct >= 50: pts.append(2.0)
        else: pts.append(0.0)
    return round(sum(pts)/len(pts), 2) if pts else 0.0

# Attendance %
def compute_attendance_rate(student):
    total = student.attendances.count()
    if total == 0: return 0.0
    present = student.attendances.filter(status=Attendance.PRESENT).count()
    return round((present / total) * 100, 2)

# Refresh student AI fields
def refresh_student_ai(student):
    student.attendance_percentage = compute_attendance_rate(student)
    student.gpa = compute_gpa(student)
    student.save(update_fields=["attendance_percentage", "gpa"])

# Signals
@receiver([post_save, post_delete], sender=Attendance)
@receiver([post_save, post_delete], sender=Result)
@receiver([post_save, post_delete], sender=Fee)
def update_student_ai(sender, instance, **kwargs):
    refresh_student_ai(instance.student)

@receiver(m2m_changed, sender=Scholarship.students.through)
def update_student_scholarship(sender, instance, **kwargs):
    for student in instance.students.all():
        refresh_student_ai(student)

# Automatic fee creation for new students
@receiver(post_save, sender=Student)
def create_student_fee(sender, instance, created, **kwargs):
    """
    Automatically create a fee record for a new student if they have department and semester assigned
    and there's an active fee structure for that department-semester combination.
    """
    if created and instance.department and instance.semester:
        try:
            # Check if there's an active fee structure for this department-semester
            fee_structure = FeeStructure.objects.filter(
                department=instance.department,
                semester=instance.semester,
                is_active=True
            ).first()

            if fee_structure:
                # Calculate due date (30 days from enrollment)
                due_date = instance.enrollment_date + timedelta(days=30)

                # Create fee record
                Fee.objects.create(
                    student=instance,
                    department=instance.department,
                    semester=instance.semester,
                    amount=fee_structure.amount,
                    due_date=due_date,
                    paid_amount=0,
                    status=Fee.UNPAID
                )
        except Exception as e:
            # Log the error but don't prevent student creation
            print(f"Error creating fee for student {instance.student_id}: {e}")