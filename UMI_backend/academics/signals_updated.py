from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.db.models import Avg, Q, Sum
from .models import Attendance, Result, Fee, FeeStructure, Scholarship, Payment
from students.models import Student
from datetime import date, timedelta
from decimal import Decimal

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
@receiver(post_save, sender=Attendance)
@receiver(post_save, sender=Result)
@receiver(post_save, sender=Fee)
def update_student_ai(sender, instance, **kwargs):
    refresh_student_ai(instance.student)

@receiver(m2m_changed, sender=Scholarship.students.through)
def update_student_scholarship(sender, instance, **kwargs):
    if hasattr(instance, 'students'):
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

# Update fee balance when payments are created or deleted
@receiver([post_save, post_delete], sender=Payment)
def update_fee_balance(sender, instance, **kwargs):
    """
    Update the fee's paid_amount and status when payments are created, updated, or deleted.
    """
    from django.db import transaction

    with transaction.atomic():
        # Use select_for_update to prevent race conditions
        fee = Fee.objects.select_for_update().get(fee_id=instance.fee.fee_id)

        # Calculate total paid amount from all payments for this fee
        total_paid = fee.payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Update fee's paid_amount
        fee.paid_amount = total_paid

        # Calculate balance (keep as Decimal for precision)
        fee.balance = fee.amount - total_paid

        # Update status based on payment amount
        if total_paid >= fee.amount:
            fee.status = Fee.PAID
            if not fee.paid_on and sender == post_save and kwargs.get('created', False):
                fee.paid_on = instance.payment_date.date()
        elif total_paid > 0:
            fee.status = Fee.PARTIAL
        else:
            fee.status = Fee.UNPAID

        fee.save(update_fields=['paid_amount', 'balance', 'status', 'paid_on'])

# Signal for final result submission, CGPA calculation, and automatic promotion
@receiver(post_save, sender=Result)
def handle_final_result_submission(sender, instance, created, **kwargs):
    """
    When a final result is saved, check if all finals for the semester are submitted.
    If yes, calculate semester GPA, update CGPA, create history, and promote if passed.
    """
    if not instance.exam_type or 'final' not in instance.exam_type.lower():
        return

    student = instance.student
    semester = instance.course.semester if instance.course else None
    if not semester or semester != student.semester:
        return

    # Check if all courses for the semester have final results
    semester_courses = semester.courses.all()
    final_results = Result.objects.filter(
        student=student,
        course__in=semester_courses,
        exam_type__icontains='final'
    )

    if final_results.count() != semester_courses.count():
        return  # Not all finals submitted yet

    # All finals submitted, calculate semester GPA
    semester_gpa = compute_gpa(student)  # Uses existing compute_gpa

    # Update student GPA and CGPA
    student.gpa = semester_gpa
    student.previous_cgpa = student.cgpa
    student.cgpa = (student.previous_cgpa + semester_gpa) / 2  # Simple average; can be weighted later
    student.save(update_fields=['gpa', 'cgpa', 'previous_cgpa'])

    # Create academic history record
    from .models import StudentAcademicHistory
    StudentAcademicHistory.objects.create(
        student=student,
        semester=semester,
        gpa=semester_gpa,
        cgpa=student.cgpa
    )

    # Check if passed (no F grades and GPA >= 2.0)
    failing_results = final_results.filter(grade='F')
    if failing_results.exists() or semester_gpa < 2.0:
        return  # Not passed, no promotion

    # Passed, promote to next semester
    next_semester = student.get_next_semester()
    if next_semester:
        from datetime import date, timedelta
        student.semester = next_semester
        student.save()  # This triggers fee creation via Student post_save

        # Update the newly created fee's due_date to 1 month from now
        fee = student.ensure_fee_exists_for_current_semester()
        if fee:
            fee.due_date = date.today() + timedelta(days=30)
            fee.save(update_fields=['due_date'])
