from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TransportRoute, Bus, StudentTransport
from .serializers import TransportRouteSerializer, BusSerializer, StudentTransportSerializer
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin


class TransportRouteViewSet(viewsets.ModelViewSet):
    queryset = TransportRoute.objects.all()
    serializer_class = TransportRouteSerializer
    permission_classes = [IsAdminOrReadOnly]


class BusViewSet(viewsets.ModelViewSet):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [IsAdminOrReadOnly]


class StudentTransportViewSet(viewsets.ModelViewSet):
    queryset = StudentTransport.objects.all()
    serializer_class = StudentTransportSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        queryset = StudentTransport.objects.all()

        # filter by student_id (optional, for admin usage)
        student_id = self.request.query_params.get("student_id")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        # if user is not staff, only show his own transports
        if not self.request.user.is_staff:
            queryset = queryset.filter(student=self.request.user)

        return queryset

    @action(detail=False, methods=["get"])
    def my_transport(self, request):
        try:
            transport = StudentTransport.objects.get(student=request.user)
            serializer = self.get_serializer(transport)
            return Response(serializer.data)
        except StudentTransport.DoesNotExist:
            return Response({"detail": "No transport assigned"}, status=404)