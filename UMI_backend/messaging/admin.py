from django.contrib import admin
from .models import Message, Call, MessageTemplate

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'message_type', 'sender', 'get_recipient', 'subject', 'sent_at', 'is_read')
    list_filter = ('message_type', 'is_read', 'sent_at')
    search_fields = ('subject', 'body')
    date_hierarchy = 'sent_at'
    
    def get_recipient(self, obj):
        if obj.recipient_student:
            return f"Student: {obj.recipient_student.name}"
        return "Unknown"
    get_recipient.short_description = 'Recipient'

@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display = ('id', 'caller', 'get_recipient', 'status', 'started_at', 'ended_at', 'duration')
    list_filter = ('status', 'started_at')
    search_fields = ('notes',)
    date_hierarchy = 'started_at'
    
    def get_recipient(self, obj):
        if obj.recipient_student:
            return f"Student: {obj.recipient_student.name}"
        return "Unknown"
    get_recipient.short_description = 'Recipient'

@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_by', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name', 'subject', 'body')
    date_hierarchy = 'created_at'
