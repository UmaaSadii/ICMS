from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
import logging

from .models import Instructor
from .serializers import InstructorSerializer
from .permissions import IsAdminOrReadOnly

logger = logging.getLogger(__name__)


class InstructorViewSet(viewsets.ModelViewSet):
    queryset = Instructor.objects.all()
    serializer_class = InstructorSerializer
    permission_classes = [IsAdminOrReadOnly]   # Requires authentication for all operations
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        print(f"InstructorViewSet create - Request data: {request.data}")
        print(f"Request content type: {request.content_type}")
        try:
            data_for_validation = request.data.copy()
            from register.models import User
            from rest_framework import serializers
            user_email = data_for_validation.pop('user_email', None)
            if not user_email:
                raise serializers.ValidationError("user_email is required")
            user, created = User.objects.get_or_create(email=user_email, defaults={'username': user_email})

            # Check if user already has an instructor profile
            if hasattr(user, 'instructor_profile'):
                raise serializers.ValidationError("User already has an instructor profile")

            serializer = self.get_serializer(data=data_for_validation)
            serializer.is_valid(raise_exception=True)
            serializer.validated_data['user'] = user
            instructor = serializer.save()

            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(f"InstructorViewSet create - Validation error: {e}")
            print(f"Request data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'No keys'}")
            raise

    def update(self, request, *args, **kwargs):
        print(f"InstructorViewSet update - Request data: {request.data}")
        print(f"Request content type: {request.content_type}")
        try:
            data_for_validation = request.data.copy()
            from register.models import User
            from rest_framework import serializers
            user_email = data_for_validation.pop('user_email', None)
            if user_email:
                user, created = User.objects.get_or_create(email=user_email, defaults={'username': user_email})
                # Update the instructor's user email if it has changed
                instance = self.get_object()
                if instance.user.email != user_email:
                    instance.user.email = user_email
                    instance.user.save()

            serializer = self.get_serializer(self.get_object(), data=data_for_validation)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data)
        except Exception as e:
            print(f"InstructorViewSet update - Validation error: {e}")
            print(f"Request data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'No keys'}")
            raise





    @action(detail=True, methods=['post'], url_path='upload-image',
            parser_classes=[MultiPartParser, FormParser],
            permission_classes=[IsAdminOrReadOnly])   # 👈 only admin can upload
    def upload_image(self, request, pk=None):
        """
        POST /api/instructors/<id>/upload-image/
        Upload image for an instructor
        """
        try:
            instructor = self.get_object()

            if 'image' not in request.FILES:
                return Response({"error": "No image file provided"},
                                status=status.HTTP_400_BAD_REQUEST)

            image_file = request.FILES['image']

            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
            if image_file.content_type not in allowed_types:
                return Response({"error": "Invalid file type. Only JPEG, PNG, and GIF allowed"},
                                status=status.HTTP_400_BAD_REQUEST)

            # Validate file size (max 5MB)
            if image_file.size > 5 * 1024 * 1024:
                return Response({"error": "File size too large. Maximum size is 5MB"},
                                status=status.HTTP_400_BAD_REQUEST)

            # Save the image
            instructor.image.save(image_file.name, image_file, save=True)

            serializer = self.get_serializer(instructor)
            return Response({
                "message": "Image uploaded successfully",
                "instructor": serializer.data
            }, status=status.HTTP_200_OK)

        except Instructor.DoesNotExist:
            return Response({"error": "Instructor not found"},
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Upload failed: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InstructorProfileView(APIView):
    """
    GET /api/instructor/profile/
    Get current instructor's profile based on authentication
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Check if user is authenticated
            if not request.user.is_authenticated:
                return Response({"detail": "Authentication credentials were not provided."},
                                status=status.HTTP_401_UNAUTHORIZED)
                
            instructor = Instructor.objects.get(user=request.user)
            serializer = InstructorSerializer(instructor)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Instructor.DoesNotExist:
            return Response({"error": "Instructor profile not found for this user"},
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)},
                             status=status.HTTP_500_INTERNAL_SERVER_ERROR)
