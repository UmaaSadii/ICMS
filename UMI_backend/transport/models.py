from django.db import models
from students.models import Student   # 👈 students_student model import kiya

# ==========================
#  Transport Route
# ==========================
class TransportRoute(models.Model):
    name = models.CharField(max_length=100)   # e.g. "Route A"
    start_point = models.CharField(max_length=100)
    end_point = models.CharField(max_length=100)
    stops = models.TextField(help_text="Comma separated stops")  # e.g. stop1, stop2, stop3

    def _str_(self):
        return self.name


# ==========================
#  Bus
# ==========================
class Bus(models.Model):
    number_plate = models.CharField(max_length=20, unique=True)
    capacity = models.IntegerField()
    driver_name = models.CharField(max_length=100)
    contact = models.CharField(max_length=20, blank=True, null=True)
    route = models.ForeignKey(
        TransportRoute,
        on_delete=models.SET_NULL,
        null=True,
        related_name="buses"
    )

    def _str_(self):
        return f"{self.number_plate} ({self.route.name if self.route else 'No Route'})"


# ==========================
#  Student Transport Mapping
# ==========================
class StudentTransport(models.Model):
    student = models.OneToOneField(   # 👈 direct link with students_student
        Student,
        on_delete=models.CASCADE,
        related_name="transport"
    )
    bus = models.ForeignKey(
        Bus,
        on_delete=models.SET_NULL,
        null=True,
        related_name="students"
    )
    pickup_point = models.CharField(max_length=100)

    def _str_(self):
        return f"{self.student.student_id} → {self.bus.number_plate if self.bus else 'No Bus'}"