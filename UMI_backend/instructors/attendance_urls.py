from django.urls import path
from .attendance_views import DepartmentStudentsView, BulkAttendanceView, InstructorDepartmentsView

urlpatterns = [
    # Attendance related endpoints
    path('departments/', InstructorDepartmentsView.as_view(), name='instructor-departments'),
    path('departments/<int:department_id>/semesters/<int:semester_id>/students/', DepartmentStudentsView.as_view(), name='department-students'),
    path('attendance/bulk/', BulkAttendanceView.as_view(), name='bulk-attendance'),
]
