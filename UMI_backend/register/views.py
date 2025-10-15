import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from .serializers import RegisterSerializer
from .permissions import IsAdminUser

logger = logging.getLogger(__name__)

User = get_user_model()

# -----------------------------
# 1️⃣ Public Register API
# -----------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    logger.info("Incoming data: %s", request.data)
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "access_token": token.key,
            "refresh_token": None
        }, status=status.HTTP_201_CREATED)
    logger.error("Registration errors: %s", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# -----------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "access_token": token.key,
            "refresh_token": None   # 👈 abhi ke liye None, baad me JWT add kar sakti ho
        }, status=status.HTTP_200_OK)

    return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# -----------------------------
# 3️⃣ List all users (all logged-in users can view)
# -----------------------------
class UserListView(generics.ListAPIView):
    """
    List all users: everyone logged-in can view
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAuthenticated]

# -----------------------------
# 4️⃣ Single user GET / PUT / DELETE
# GET → all logged-in users
# PUT/DELETE → admin only
# -----------------------------
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            # sirf admin modify/delete
            return [IsAuthenticated(), IsAdminUser()]
        # GET → sab logged-in users
        return [IsAuthenticated()]