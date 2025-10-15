from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrReadOnly(BasePermission):
    """
    Only admin can add/update/delete books.
    Students can only read or use custom borrow/return actions.
    """
    def has_permission(self, request, view):
        # SAFE_METHODS = GET, HEAD, OPTIONS (read-only)
        if request.method in SAFE_METHODS:
            return True  
        return request.user and request.user.is_staff  # only admin can modify