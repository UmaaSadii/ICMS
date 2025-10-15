from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, MessageTemplateViewSet, send_individual_message, messaging_stats

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')
# router.register(r'calls', CallViewSet, basename='call')  # Disabled due to missing CallViewSet
router.register(r'templates', MessageTemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
    path('send-individual/', send_individual_message, name='send_individual'),
    path('stats/', messaging_stats, name='messaging_stats'),
]
