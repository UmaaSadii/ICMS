from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, StudentProfileView

router = DefaultRouter()
router.register(r'', StudentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', StudentProfileView.as_view(), name='student-profile'),
]