from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .attendance_serializers import StudentSerializer, BulkAttendanceSerializer
from .permissions import IsInstructorForDepartment
from students.models import Student
from academics.models import Attendance, Department, Semester
from .models import Instructor


class InstructorDepartmentsView(APIView):
    """
    GET /api/instructors/departments/
    Get all departments for instructors to work with attendance and results
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Check if user is admin
            if (request.user.is_staff or
                getattr(request.user, 'role', None) in ['admin', 'principal', 'director']):
                # Admins can see all departments
                departments = Department.objects.all()
            else:
                # Instructors can now see ALL departments to mark attendance and upload results
                departments = Department.objects.all()

            # Use the DepartmentSerializer from academics
            from academics.serializers import DepartmentSerializer
            serializer = DepartmentSerializer(departments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DepartmentStudentsView(APIView):
    """
    GET /api/instructors/departments/<department_id>/semesters/<semester_id>/students/
    Get students by department and semester for attendance marking
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, department_id, semester_id):
        try:
            # Verify department exists
            department = Department.objects.get(pk=department_id)

            # For instructors working with all departments, we need to be more flexible
            # Check if semester exists and belongs to the department, or if it's a valid semester
            try:
                semester = Semester.objects.get(pk=semester_id, department=department)
            except Semester.DoesNotExist:
                # If semester doesn't belong to this department, try to find it in any department
                # This allows instructors to work with semesters that might be shared or misassigned
                try:
                    semester = Semester.objects.get(pk=semester_id)
                except Semester.DoesNotExist:
                    return Response({"error": "Semester not found"}, status=status.HTTP_404_NOT_FOUND)

            # Get students in this department and semester
            students = Student.objects.filter(department=department, semester=semester)
            serializer = StudentSerializer(students, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Department.DoesNotExist:
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkAttendanceView(APIView):
    """
    POST /api/instructors/attendance/bulk/
    Mark attendance for multiple students at once
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = BulkAttendanceSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            date = serializer.validated_data['date']
            attendances_data = serializer.validated_data['attendances']

            created_attendances = []
            for attendance_data in attendances_data:
                student_id = attendance_data['student_id']
                status_value = attendance_data['status']

                try:
                    student = Student.objects.get(pk=student_id)
                    # Create or update attendance record
                    attendance, created = Attendance.objects.update_or_create(
                        student=student,
                        date=date,
                        defaults={'status': status_value}
                    )
                    created_attendances.append({
                        'student_id': student.student_id,
                        'student_name': student.name,
                        'status': attendance.status,
                        'created': created
                    })
                except Student.DoesNotExist:
                    return Response({"error": f"Student with id {student_id} not found"},
                                   status=status.HTTP_404_NOT_FOUND)

            return Response({
                "message": f"Attendance marked for {len(created_attendances)} students",
                "attendances": created_attendances
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
