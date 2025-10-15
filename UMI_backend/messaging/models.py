from django.db import models
from django.utils import timezone
from django.conf import settings
from students.models import Student
from instructors.models import Instructor

class Message(models.Model):
    MESSAGE_TYPES = (
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
        ('CALL', 'Call'),
    )
    
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    recipient_student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True, related_name='received_messages')
    recipient_instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE, null=True, blank=True, related_name='received_messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    subject = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField()
    sent_at = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"{self.message_type} from {self.sender} to {self.recipient_student} on {self.sent_at.strftime('%Y-%m-%d %H:%M')}"

class Call(models.Model):
    CALL_STATUS = (
        ('INITIATED', 'Initiated'),
        ('CONNECTED', 'Connected'),
        ('ENDED', 'Ended'),
        ('FAILED', 'Failed'),
    )
    
    caller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='initiated_calls')
    recipient_student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True, related_name='received_calls')
    recipient_instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE, null=True, blank=True, related_name='received_calls')
    status = models.CharField(max_length=20, choices=CALL_STATUS, default='INITIATED')
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(default=0)  # Duration in seconds
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Call from {self.caller} to {self.recipient_student} on {self.started_at.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        if self.ended_at and self.started_at:
            self.duration = self.ended_at - self.started_at
        super().save(*args, **kwargs)

class MessageTemplate(models.Model):
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=255, blank=True, null=True)
    body = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
