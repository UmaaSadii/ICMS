from django.db import models
from datetime import date

# ---------- Department ----------
class Department(models.Model):
    department_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    num_semesters = models.PositiveIntegerField(default=8)

    def __str__(self):
        return f"{self.name} ({self.code})"

# ---------- Semester ----------
class Semester(models.Model):
    semester_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    semester_code = models.CharField(max_length=10, unique=True)
    program = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField(default=30)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="semesters")

    def __str__(self):
        return f"{self.name} ({self.semester_code}) - {self.department.name}"

    @property
    def is_base_semester(self):
        """Check if this semester is a base semester (odd numbered)"""
        try:
            semester_num = int(self.name.split()[-1])
            return semester_num % 2 == 1
        except (ValueError, IndexError):
            return False

    @property
    def base_semester(self):
        """Get the base semester for this semester"""
        if self.is_base_semester:
            return self
        try:
            semester_num = int(self.name.split()[-1])
            base_num = semester_num - 1
            base_name = f"Semester {base_num}"
            return Semester.objects.filter(
                department=self.department,
                name=base_name
            ).first()
        except (ValueError, IndexError, Semester.DoesNotExist):
            return None

# ---------- Course ----------
class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    credits = models.PositiveIntegerField(default=3)
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="courses", null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

# ---------- Attendance ----------
class Attendance(models.Model):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"
    STATUS_CHOICES = [(PRESENT, "Present"), (ABSENT, "Absent"), (LATE, "Late")]

    attendance_id = models.AutoField(primary_key=True)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="attendances")
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)

    class Meta:
        unique_together = ("student", "date")  # 1 din me 1 hi record
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student.name} - {self.date} ({self.status})"


# ---------- Result ----------
class Result(models.Model):
    result_id = models.AutoField(primary_key=True)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="results")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="results", null=True, blank=True)
    exam_type = models.CharField(max_length=50, blank=True, default="Mid Exam")  # e.g. Mid, Final
    exam_date = models.DateField(null=True, blank=True, default=date(2025,9,25))

    # Marks structure: 2 quizzes (5 marks each), 2 assignments (5 marks each), mid-term (25 marks), final (60 marks)
    quiz1_marks = models.FloatField(default=0)        # Max 5
    quiz2_marks = models.FloatField(default=0)        # Max 5
    assignment1_marks = models.FloatField(default=0)  # Max 5
    assignment2_marks = models.FloatField(default=0)  # Max 5
    mid_term_marks = models.FloatField(default=0)     # Max 25
    final_marks = models.FloatField(default=0)        # Max 60

    total_marks = models.FloatField()  # Calculated based on exam_type
    obtained_marks = models.FloatField()  # Calculated as sum of relevant marks
    grade = models.CharField(max_length=2, blank=True, default='F')

    class Meta:
        ordering = ["-exam_date"]

    def __str__(self):
        return f"{self.student.name} - {self.course.name}"

    @property
    def percentage(self):
        return (self.obtained_marks / self.total_marks) * 100 if self.total_marks else 0

    def save(self, *args, **kwargs):
        # Calculate total_marks and obtained_marks based on exam_type
        exam_type_lower = self.exam_type.lower() if self.exam_type else ''

        if 'quiz' in exam_type_lower:
            self.total_marks = 5
            # For quiz, determine which quiz slot to use
            if '1' in exam_type_lower or self.quiz1_marks == 0:
                self.obtained_marks = self.quiz1_marks
            else:
                self.obtained_marks = self.quiz2_marks
        elif 'assignment' in exam_type_lower:
            self.total_marks = 5
            # For assignment, determine which assignment slot to use
            if '1' in exam_type_lower or self.assignment1_marks == 0:
                self.obtained_marks = self.assignment1_marks
            else:
                self.obtained_marks = self.assignment2_marks
        elif 'mid' in exam_type_lower:
            self.total_marks = 25
            self.obtained_marks = self.mid_term_marks
        elif 'final' in exam_type_lower:
            # Final grade is calculated from all assessments
            # Total: 2 quizzes (5 each) + 2 assignments (5 each) + mid (25) + final (60) = 100
            total_assessments = (
                self.quiz1_marks + self.quiz2_marks +  # 10 marks
                self.assignment1_marks + self.assignment2_marks +  # 10 marks
                self.mid_term_marks +  # 25 marks
                self.final_marks  # 60 marks
            )
            self.total_marks = 100
            self.obtained_marks = total_assessments
        else:
            # Default to mid-term if exam_type not recognized
            self.total_marks = 25
            self.obtained_marks = self.mid_term_marks

        # Calculate grade based on percentage
        percentage = (self.obtained_marks / self.total_marks) * 100 if self.total_marks > 0 else 0

        if percentage >= 90:
            self.grade = 'A+'
        elif percentage >= 85:
            self.grade = 'A'
        elif percentage >= 80:
            self.grade = 'A-'
        elif percentage >= 75:
            self.grade = 'B+'
        elif percentage >= 70:
            self.grade = 'B'
        elif percentage >= 65:
            self.grade = 'B-'
        elif percentage >= 60:
            self.grade = 'C+'
        elif percentage >= 55:
            self.grade = 'C'
        elif percentage >= 50:
            self.grade = 'C-'
        elif percentage >= 45:
            self.grade = 'D+'
        elif percentage >= 40:
            self.grade = 'D'
        else:
            self.grade = 'F'

        super().save(*args, **kwargs)


# ---------- Fee Structure ----------
class FeeStructure(models.Model):
    fee_structure_id = models.AutoField(primary_key=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="fee_structures")
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="fee_structures")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['department', 'semester']
        ordering = ['department', 'semester']

    @staticmethod
    def get_default_amount_for_semester(semester):
        """Get default fee amount based on semester parity - even: $25,000, odd: $30,000"""
        try:
            semester_num = int(semester.name.split()[-1])  # Extract number from "Semester X"
            if semester_num % 2 == 0:
                return 25000.00  # Even semesters
            else:
                return 30000.00  # Odd semesters
        except (ValueError, IndexError):
            return 30000.00  # Default fallback

    def save(self, *args, **kwargs):
        # Set default amount if not provided
        if not self.amount:
            self.amount = self.get_default_amount_for_semester(self.semester)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.department.name} - {self.semester.name} - ${self.amount}"

# ---------- Fee ----------
class Fee(models.Model):
    PAID = "Paid"
    UNPAID = "Unpaid"
    PARTIAL = "Partial"
    STATUS_CHOICES = [(PAID, "Paid"), (UNPAID, "Unpaid"), (PARTIAL, "Partial")]

    fee_id = models.AutoField(primary_key=True)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="fees")
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="department_fees", null=True, blank=True)
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name="semester_fees", null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=UNPAID)
    due_date = models.DateField()
    paid_on = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-due_date"]

    def update_balance_and_status(self):
        """Update balance and status based on paid_amount"""
        from django.utils import timezone
        self.balance = self.amount - self.paid_amount
        self._balance_calculated = True  # Flag to prevent recalculation in save()

        if self.paid_amount >= self.amount:
            self.status = self.PAID
            if not self.paid_on:
                self.paid_on = timezone.now().date()
        elif self.paid_amount > 0:
            self.status = self.PARTIAL
        else:
            self.status = self.UNPAID

        super().save(update_fields=['balance', 'status', 'paid_on'])

    def can_progress_to_next_semester(self):
        """Check if student can progress to next semester"""
        # Must have paid current semester fee
        if self.status in ['Unpaid', 'Partial']:
            return False, "Outstanding fee payment required"

        # Must have passed all courses (no F grades in final results)
        final_results = Result.objects.filter(
            student=self.student,
            course__semester=self.semester,
            exam_type__icontains='final'
        )

        if not final_results.exists():
            return False, "Final results not submitted yet"

        # Check for failing grades
        failing_results = final_results.filter(grade='F')
        if failing_results.exists():
            return False, f"Failed {failing_results.count()} course(s) - cannot progress"

        return True, "Eligible for progression"

    def save(self, *args, **kwargs):
        # Calculate balance before saving if not already calculated
        # (skip if balance is explicitly being updated by signals or update_balance_and_status)
        if not hasattr(self, '_balance_calculated') or not self._balance_calculated:
            self.balance = self.amount - self.paid_amount
        super().save(*args, **kwargs)

    def receipt_text(self):
        """Generate a simple text receipt for the fee"""
        student_name = self.student.name or f"{self.student.first_name} {self.student.last_name}".strip() or 'Unknown'
        registration = self.student.registration_number or self.student.student_id or 'N/A'
        department = self.student.department.name if self.student.department else 'N/A'
        return f"""
Fee Receipt
-----------
Student: {student_name}
Registration: {registration}
Department: {department}
Semester: {self.semester.name if self.semester else 'N/A'}
Amount: ${self.amount}
Paid Amount: ${self.paid_amount}
Balance: ${self.balance}
Status: {self.status}
Due Date: {self.due_date}
Paid On: {self.paid_on if self.paid_on else 'N/A'}
        """.strip()

    def __str__(self):
        semester_name = self.semester.name if self.semester else "No Semester"
        return f"{self.student.name} - {semester_name} - {self.status}"


# ---------- Payment ----------
class Payment(models.Model):
    CASH = "Cash"
    ONLINE = "Online"
    CHEQUE = "Cheque"
    PAYMENT_METHOD_CHOICES = [(CASH, "Cash"), (ONLINE, "Online"), (CHEQUE, "Cheque")]

    payment_id = models.AutoField(primary_key=True)
    fee = models.ForeignKey(Fee, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, default=CASH)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payment_date"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Fee balance update is handled by signals to avoid double updates

    def __str__(self):
        return f"Payment of ${self.amount} for {self.fee.student.name} on {self.payment_date}"


# ---------- Scholarship ----------
class Scholarship(models.Model):
    scholarship_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    eligibility = models.TextField(blank=True)
    students = models.ManyToManyField("students.Student", related_name="scholarships", blank=True)

    def __str__(self):
        return self.name

# ---------- Student Academic History ----------
class StudentAcademicHistory(models.Model):
    history_id = models.AutoField(primary_key=True)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="academic_history")
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE)
    gpa = models.FloatField()  # Semester GPA
    cgpa = models.FloatField()  # Cumulative GPA at this point
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ['student', 'semester']

    def __str__(self):
        return f"{self.student.name} - {self.semester.name} - GPA: {self.gpa}, CGPA: {self.cgpa}"
