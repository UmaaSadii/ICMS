from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransportRouteViewSet, BusViewSet, StudentTransportViewSet

router = DefaultRouter()
router.register("routes", TransportRouteViewSet, basename="routes")
router.register("buses", BusViewSet, basename="buses")
router.register("student", StudentTransportViewSet, basename="student-transport")

urlpatterns = [
    path("transport/", include(router.urls)),
]