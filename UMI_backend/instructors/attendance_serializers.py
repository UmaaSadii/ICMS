from rest_framework import serializers
from academics.models import Attendance
from students.models import Student


class StudentSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    semester_name = serializers.CharField(source='semester.name', read_only=True)

    class Meta:
        model = Student
        fields = ['student_id', 'name', 'email', 'department', 'semester', 'department_name', 'semester_name']


class BulkAttendanceSerializer(serializers.Serializer):
    date = serializers.DateField()
    attendances = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField(),
            allow_empty=False
        ),
        allow_empty=False
    )

    def validate_attendances(self, value):
        for attendance in value:
            if 'student_id' not in attendance or 'status' not in attendance:
                raise serializers.ValidationError("Each attendance must have 'student_id' and 'status'")
            if attendance['status'] not in ['Present', 'Absent', 'Late']:
                raise serializers.ValidationError("Status must be 'Present', 'Absent', or 'Late'")
        return value
