"""
URL configuration for UMI_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token
from academics import views as academics_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', include('register.urls')),
    path('api/students/', include('students.urls')),
    path("api/academics/", include("academics.urls")),

    path('api/token/', obtain_auth_token),  # Token generate karne ke liye
    path('api/instructors/', include('instructors.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api/monitoring/', include('monitoring.urls')),
    path('api/library/', include('library.urls')),
    path('api/transport/', include('transport.urls'))
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
