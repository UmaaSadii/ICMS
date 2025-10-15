 
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Value
from django.db.models.functions import Concat
from django.utils import timezone
from .models import Message, Call, MessageTemplate
from .serializers import MessageSerializer, CallSerializer, MessageTemplateSerializer
from students.models import Student
from instructors.models import Instructor

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Return messages sent by or received by the current user
        user = self.request.user
        return Message.objects.filter(Q(sender=user))
    
    @action(detail=False, methods=['get'])
    def search_recipients(self, request):
        query = request.query_params.get('q', '')
        recipient_type = request.query_params.get('type', 'STUDENT')

        results = []

        if recipient_type == 'STUDENT':
            students = Student.objects.annotate(
                full_name=Concat('first_name', Value(' '), 'last_name')
            ).filter(
                Q(full_name__icontains=query) |
                Q(email__icontains=query)
            )[:10]

            for student in students:
                results.append({
                    'id': student.id,
                    'name': student.full_name,
                    'email': student.email,
                    'type': 'STUDENT'
                })
        elif recipient_type == 'INSTRUCTOR':
            instructors = Instructor.objects.filter(
                Q(name__icontains=query) |
                Q(user__email__icontains=query)
            )[:10]

            for instructor in instructors:
                results.append({
                    'id': instructor.id,
                    'name': instructor.name,
                    'email': instructor.user.email,
                    'type': 'INSTRUCTOR'
                })
        else:
            return Response({"error": "Invalid recipient type. Only 'STUDENT' and 'INSTRUCTOR' are supported."},
                            status=status.HTTP_400_BAD_REQUEST)

        return Response(results)
    
    @action(detail=False, methods=['post'])
    def send_individual(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def send_bulk(self, request):
        recipient_ids = request.data.get('recipient_ids', [])
        recipient_type = request.data.get('recipient_type', '')
        message_type = request.data.get('message_type', '')
        subject = request.data.get('subject', '')
        body = request.data.get('body', '')
        
        if not recipient_ids or not recipient_type or not message_type or not body:
            return Response(
                {'error': 'recipient_ids, recipient_type, message_type, and body are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        messages = []
        errors = []
        
        for recipient_id in recipient_ids:
            try:
                message_data = {
                    'recipient_id': recipient_id,
                    'recipient_type': recipient_type,
                    'message_type': message_type,
                    'subject': subject,
                    'body': body
                }
                serializer = self.get_serializer(data=message_data)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                messages.append(serializer.data)
            except Exception as e:
                errors.append({
                    'recipient_id': recipient_id,
                    'error': str(e)
                })
        
        return Response({
            'messages': messages,
            'errors': errors,
            'total_sent': len(messages),
            'total_failed': len(errors)
        })
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        recipient_id = request.query_params.get('recipient_id')
        recipient_type = request.query_params.get('recipient_type')

        if not recipient_id or not recipient_type:
            return Response(
                {'error': 'recipient_id and recipient_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        queryset = None

        if recipient_type.upper() == 'STUDENT':
            try:
                student = Student.objects.get(id=recipient_id)
                queryset = Message.objects.filter(
                    Q(sender=user, recipient_student=student)
                ).order_by('-sent_at')
            except Student.DoesNotExist:
                return Response(
                    {'error': 'Student not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif recipient_type.upper() == 'INSTRUCTOR':
            try:
                instructor = Instructor.objects.get(id=recipient_id)
                queryset = Message.objects.filter(
                    Q(sender=user, recipient_instructor=instructor) |
                    Q(sender=instructor.user, recipient_instructor=instructor)
                ).order_by('-sent_at')
            except Instructor.DoesNotExist:
                return Response(
                    {'error': 'Instructor not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Invalid recipient_type. Only STUDENT and INSTRUCTOR are supported.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        message = self.get_object()
        message.is_read = True
        message.read_at = timezone.now()
        message.save(update_fields=['is_read', 'read_at'])
        serializer = self.get_serializer(message)
        return Response(serializer.data)

class MessageTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = MessageTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return MessageTemplate.objects.filter(created_by=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_individual_message(request):
    """
    API endpoint to send an individual message.
    Supports searching recipients by type (student or instructor) with query param 'search'.
    """
    search_query = request.query_params.get('search', '')
    recipient_type = request.query_params.get('type', 'STUDENT').upper()

    # If search query is provided, return matching recipients
    if search_query:
        results = []
        if recipient_type == 'STUDENT':
            students = Student.objects.annotate(
                full_name=Concat('first_name', Value(' '), 'last_name')
            ).filter(
                Q(full_name__icontains=search_query) |
                Q(email__icontains=search_query)
            )[:10]
            for student in students:
                results.append({
                    'id': student.id,
                    'name': student.full_name,
                    'email': student.email,
                    'type': 'STUDENT'
                })
        elif recipient_type == 'INSTRUCTOR':
            instructors = Instructor.objects.filter(
                Q(name__icontains=search_query) |
                Q(user__email__icontains=search_query)
            )[:10]
            for instructor in instructors:
                results.append({
                    'id': instructor.id,
                    'name': instructor.name,
                    'email': instructor.user.email,
                    'type': 'INSTRUCTOR'
                })
        else:
            return Response({"error": "Invalid recipient type. Only 'STUDENT' and 'INSTRUCTOR' are supported."},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response(results)

    # If no search query, process sending message
    serializer = MessageSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def messaging_stats(request):
    """
    API endpoint to return messaging statistics.
    """
    user = request.user
    total_sent = Message.objects.filter(sender=user).count()
    total_received = Message.objects.filter(recipient_student__email=user.email).count() + Message.objects.filter(recipient_instructor__user=user).count()

    stats = {
        'total_sent': total_sent,
        'total_received': total_received,
    }
    return Response(stats)

