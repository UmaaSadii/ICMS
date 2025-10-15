from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .services.analysis import generate_performance_notes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Student
from .serializers import StudentSerializer
from .permissions import IsStaffOrAdmin
from academics.serializers import CourseSerializer

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsStaffOrAdmin]  # Admin or staff modify kar sakta
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'semester']
    search_fields = ['name', 'email', 'student_id', 'first_name', 'last_name']
    ordering_fields = ['name', 'student_id', 'enrollment_date']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        department = self.request.query_params.get('department')
        semester = self.request.query_params.get('semester')

        print(f"StudentViewSet filtering - department: {department}, semester: {semester}")

        if department:
            queryset = queryset.filter(department_id=department)
            print(f"Filtered by department {department}: {queryset.count()} students")
        if semester:
            queryset = queryset.filter(semester_id=semester)
            print(f"Filtered by semester {semester}: {queryset.count()} students")

        return queryset

    def create(self, request, *args, **kwargs):
        print(f"StudentViewSet create - Request data: {request.data}")
        print(f"Request content type: {request.content_type}")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"StudentViewSet create - Validation error: {e}")
            print(f"Request data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'No keys'}")
            raise

    def update(self, request, *args, **kwargs):
        print(f"StudentViewSet update - Request data: {request.data}")
        print(f"Request content type: {request.content_type}")
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            print(f"StudentViewSet update - Validation error: {e}")
            print(f"Request data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'No keys'}")
            raise

    @action(detail=True, methods=["post"], url_path="generate-notes")
    def generate_notes(self, request, pk=None):
        """
        POST /api/students/<id>/generate-notes/
        Generates performance_notes and saves to the Student.
        Optional query params:
          - save=false  (agar sirf preview chahiye ho, save na karna ho)
        """
        student = self.get_object()
        notes = generate_performance_notes(student)

        save_flag = str(request.query_params.get("save", "true")).lower() != "false"
        if save_flag:
            student.performance_notes = notes
            student.save(update_fields=["performance_notes"])

        return Response(
            {
                "student_id": student.student_id,
                "saved": save_flag,
                "performance_notes": notes,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='upload-image', parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """
        POST /api/students/<id>/upload-image/
        Upload image for a student
        """
        try:
            student = self.get_object()
            
            if 'image' not in request.FILES:
                return Response(
                    {"error": "No image file provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            image_file = request.FILES['image']
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if image_file.content_type not in allowed_types:
                return Response(
                    {"error": "Invalid file type. Only JPEG, PNG, and GIF images are allowed"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response(
                    {"error": "File size too large. Maximum size is 5MB"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the image
            student.image = image_file
            student.save(update_fields=['image'])
            
            # Return updated student data
            serializer = self.get_serializer(student)
            return Response({
                "message": "Image uploaded successfully",
                "student": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Student.DoesNotExist:
            return Response(
                {"error": "Student not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Upload failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"error": f"Cannot delete student: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'], url_path='courses')
    def get_student_courses(self, request, pk=None):
        """
        GET /api/students/<id>/courses/
        Get all courses assigned to a specific student
        """
        try:
            student = self.get_object()
            courses = student.courses.all()
            serializer = CourseSerializer(courses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response(
                {"error": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch courses: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StudentProfileView(APIView):
    """
    GET /api/students/profile/
    Get current student's profile based on authentication
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get student by email (assuming email is used for authentication)
            student = Student.objects.get(email=request.user.email)
            serializer = StudentSerializer(student)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response(
                {"error": "Student profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )