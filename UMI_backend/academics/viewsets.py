from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Department, Semester, Course
from .serializers import DepartmentSerializer, SemesterSerializer, CourseSerializer
from .permissions import AllowAnyReadOnly


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAnyReadOnly]

    @action(detail=True, methods=['get'])
    def semesters(self, request, pk=None):
        department = self.get_object()
        semesters = Semester.objects.filter(department=department)
        serializer = SemesterSerializer(semesters, many=True)
        return Response(serializer.data)


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [AllowAnyReadOnly]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAnyReadOnly]
