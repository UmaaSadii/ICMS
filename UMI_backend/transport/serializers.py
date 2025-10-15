from rest_framework import serializers
from .models import TransportRoute, Bus, StudentTransport
from students.models import Student


# ==========================
#  Transport Route Serializer
# ==========================
class TransportRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportRoute
        fields = "__all__"


# ==========================
#  Bus Serializer
# ==========================
class BusSerializer(serializers.ModelSerializer):
    route = TransportRouteSerializer(read_only=True)  
    route_id = serializers.PrimaryKeyRelatedField(
        queryset=TransportRoute.objects.all(),
        source="route",
        write_only=True
    )

    class Meta:
        model = Bus
        fields = ["id", "number_plate", "capacity", "driver_name", "contact", "route", "route_id"]


# ==========================
#  Student Serializer (short info)
# ==========================
class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ["id", "student_id", "full_name", "department", "semester"]  # adjust as per your model


# ==========================
#  Student Transport Serializer
# ==========================
class StudentTransportSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)  
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source="student",
        write_only=True
    )
    bus = BusSerializer(read_only=True)
    bus_id = serializers.PrimaryKeyRelatedField(
        queryset=Bus.objects.all(),
        source="bus",
        write_only=True
    )

    class Meta:
        model = StudentTransport
        fields = ["id", "student", "student_id", "bus", "bus_id", "pickup_point"]