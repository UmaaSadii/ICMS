from rest_framework import serializers
from .models import Message, Call, MessageTemplate
from students.models import Student
from instructors.models import Instructor
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    recipient_id = serializers.IntegerField(write_only=True)
    recipient_type = serializers.CharField(write_only=True)
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'recipient_id', 'recipient_type', 'recipient_name', 
                  'message_type', 'subject', 'body', 'sent_at', 'is_read', 'read_at']
        read_only_fields = ['sender', 'sent_at', 'is_read', 'read_at']
    
    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username

    def get_recipient_name(self, obj):
        if obj.recipient_student:
            return obj.recipient_student.name
        elif obj.recipient_instructor:
            return obj.recipient_instructor.name
        return None
    
    def create(self, validated_data):
        recipient_type = validated_data.pop('recipient_type')
        recipient_id = validated_data.pop('recipient_id')

        # Set the sender to the current user
        request = self.context.get('request', None)
        if request is None:
            raise serializers.ValidationError("Request context is required")
        validated_data['sender'] = request.user

        # Set the appropriate recipient based on type
        if recipient_type == 'STUDENT':
            try:
                student = Student.objects.get(id=recipient_id)
                validated_data['recipient_student'] = student
            except Student.DoesNotExist:
                raise serializers.ValidationError({"recipient_id": "Student not found"})
        elif recipient_type == 'INSTRUCTOR':
            try:
                instructor = Instructor.objects.get(id=recipient_id)
                validated_data['recipient_instructor'] = instructor
            except Instructor.DoesNotExist:
                raise serializers.ValidationError({"recipient_id": "Instructor not found"})
        else:
            raise serializers.ValidationError({"recipient_type": "Invalid recipient type. Only 'STUDENT' and 'INSTRUCTOR' are supported."})

        return super().create(validated_data)

class CallSerializer(serializers.ModelSerializer):
    recipient_id = serializers.IntegerField(write_only=True)
    recipient_type = serializers.CharField(write_only=True)
    caller_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = Call
        fields = ['id', 'caller', 'caller_name', 'recipient_id', 'recipient_type', 'recipient_name',
                  'status', 'started_at', 'ended_at', 'duration', 'duration_minutes', 'notes']
        read_only_fields = ['caller', 'started_at', 'duration']
    
    def get_caller_name(self, obj):
        return obj.caller.get_full_name() or obj.caller.username
    
    def get_recipient_name(self, obj):
        if obj.recipient_student:
            return obj.recipient_student.name
        elif obj.recipient_instructor:
            return obj.recipient_instructor.name
        return None
    
    def get_duration_minutes(self, obj):
        if obj.duration:
            return obj.duration.total_seconds() / 60
        return None
    
    def create(self, validated_data):
        recipient_id = validated_data.pop('recipient_id')
        recipient_type = validated_data.pop('recipient_type')

        # Set the caller to the current user
        request = self.context.get('request', None)
        if request is None:
            raise serializers.ValidationError("Request context is required")
        validated_data['caller'] = request.user

        # Set the appropriate recipient based on type
        if recipient_type == 'STUDENT':
            try:
                student = Student.objects.get(id=recipient_id)
                validated_data['recipient_student'] = student
            except Student.DoesNotExist:
                raise serializers.ValidationError({'recipient_id': 'Student not found'})
        elif recipient_type == 'INSTRUCTOR':
            try:
                instructor = Instructor.objects.get(id=recipient_id)
                validated_data['recipient_instructor'] = instructor
            except Instructor.DoesNotExist:
                raise serializers.ValidationError({'recipient_id': 'Instructor not found'})
        else:
            raise serializers.ValidationError({'recipient_type': 'Invalid recipient type. Only STUDENT and INSTRUCTOR are supported.'})

        return super().create(validated_data)

class MessageTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageTemplate
        fields = ['id', 'name', 'subject', 'body', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username
    
    def create(self, validated_data):
        request = self.context.get('request', None)
        if request is None:
            raise serializers.ValidationError("Request context is required")
        validated_data['created_by'] = request.user
        return super().create(validated_data)
