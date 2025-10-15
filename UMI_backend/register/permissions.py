from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Sirf admin role wale users ko allow karega
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'