from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LibraryBookViewSet, FineViewSet

router = DefaultRouter()
router.register(r'books', LibraryBookViewSet)

router.register(r'fines', FineViewSet)

urlpatterns = [
    path('', include(router.urls)),
]