from rest_framework.permissions import BasePermission, SAFE_METHODS

class AllowAnyReadOnly(BasePermission):
    """
    Custom permission to allow read-only access to any request.
    Write access is restricted to authenticated users.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

class IsAdminRoleOrReadOnly(BasePermission):
    """
    Custom permission to only allow admin users to edit objects.
    Read-only access is allowed to any request.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or
            getattr(request.user, 'role', None) in ['admin', 'principal', 'director']
        )

class IsAdminOrInstructorForResultsAttendance(BasePermission):
    """
    Custom permission to allow only admin or instructor users to modify results and attendance.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or
            getattr(request.user, 'role', None) in ['admin', 'principal', 'director', 'instructor']
        )

class FeePaymentRequired(BasePermission):
    """
    Permission that checks if a student has paid their current semester fees
    before allowing certain actions like semester progression.
    """
    def has_permission(self, request, view):
        # Allow read access
        if request.method in SAFE_METHODS:
            return True

        # For write operations, check student fee status
        student_id = view.kwargs.get('student_id') or request.data.get('student_id')
        if not student_id:
            return True  # Allow if no student specified

        try:
            from students.models import Student
            from academics.models import Fee

            student = Student.objects.get(student_id=student_id)

            # Check if student has unpaid fees for current semester
            unpaid_fee = Fee.objects.filter(
                student=student,
                semester=student.semester,
                status__in=['Unpaid', 'Partial']
            ).first()

            if unpaid_fee:
                # Return False - the view should handle the error message
                return False

            return True

        except Student.DoesNotExist:
            return False
