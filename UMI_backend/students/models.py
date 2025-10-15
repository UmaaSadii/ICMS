from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class Student(models.Model):
    student_id = models.CharField(max_length=20, primary_key=True, unique=True)   # Custom ID like it-001
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    department = models.ForeignKey("academics.Department", on_delete=models.SET_NULL, null=True, blank=True)
    semester = models.ForeignKey("academics.Semester", on_delete=models.SET_NULL, null=True, blank=True)
    date_of_birth = models.DateField()
    father_guardian = models.CharField(max_length=100, blank=True, null=True)
    image = models.ImageField(upload_to="student_images/", null=True, blank=True)

    # New fields for detailed form
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    password = models.CharField(max_length=128, blank=True, null=True)
    registration_number = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], default='male', blank=True, null=True)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_contact = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    batch = models.CharField(max_length=20, blank=True, null=True)  # e.g., "2025-2029"
    enrollment_date = models.DateField(auto_now_add=True)  # Admission date
    attendance_percentage = models.FloatField(default=0.0) # AI ke liye
    gpa = models.FloatField(default=0.0)                   # AI ke liye
    cgpa = models.FloatField(default=0.0)                  # Cumulative GPA
    previous_cgpa = models.FloatField(default=0.0)         # For CGPA calculation
    performance_notes = models.TextField(blank=True, null=True)

    courses = models.ManyToManyField("academics.Course", related_name="students", blank=True)

    def save(self, *args, **kwargs):
        if not self.student_id and self.department:
            dept_code = self.department.code.lower()
            count = Student.objects.filter(department=self.department).count()
            self.student_id = f"{dept_code}{str(count + 1).zfill(3)}"
        super().save(*args, **kwargs)

    def can_perform_action(self, action_type):
        """
        Check if student can perform certain actions based on fee status
        action_type: 'progress_semester', 'register_courses', etc.
        """
        from academics.models import Fee

        # Get current semester fee
        current_fee = Fee.objects.filter(
            student=self,
            semester=self.semester,
            status__in=['Unpaid', 'Partial']
        ).first()

        if current_fee:
            return False, f"Cannot {action_type.replace('_', ' ')} - outstanding fee payment of ${current_fee.balance} required"

        return True, "Action permitted"

    def ensure_fee_exists_for_current_semester(self, due_date=None):
        """
        Ensure a fee record exists for the student's current semester
        due_date: optional, defaults to '2025-01-01' or provided
        """
        from academics.models import Fee, FeeStructure
        from datetime import date

        if not self.semester or not self.department:
            return None

        # Check if fee already exists
        fee = Fee.objects.filter(
            student=self,
            department=self.department,
            semester=self.semester
        ).first()

        if not fee:
            # Create new fee record
            default_amount = FeeStructure.get_default_amount_for_semester(self.semester)
            if due_date is None:
                due_date = date(2025, 1, 1)  # Default
            fee = Fee.objects.create(
                student=self,
                department=self.department,
                semester=self.semester,
                amount=default_amount,
                paid_amount=0,
                status=Fee.UNPAID,
                due_date=due_date
            )

        return fee

    def get_next_semester(self):
        """
        Get the next semester in sequence for the student's department
        """
        if not self.semester or not self.department:
            return None
        try:
            current_num = int(self.semester.name.split()[-1])
            next_num = current_num + 1
            from academics.models import Semester
            return Semester.objects.filter(
                department=self.department,
                name=f"Semester {next_num}"
            ).first()
        except (ValueError, IndexError):
            return None

    def __str__(self):
        return self.name


@receiver(post_save, sender=Student)
def create_fee_for_student_semester(sender, instance, created, **kwargs):
    """
    Automatically create a fee record when a student's semester is updated
    """
    if instance.semester and instance.department:
        instance.ensure_fee_exists_for_current_semester()
