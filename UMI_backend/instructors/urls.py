from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InstructorViewSet, InstructorProfileView
from . import attendance_urls

router = DefaultRouter()
router.register(r'instructor', InstructorViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', InstructorProfileView.as_view(), name='instructor-profile'),
    path('', include(attendance_urls)),
]
