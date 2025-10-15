from django.urls import path, include
from .views import (
    StudentResultListCreateEnhanced,
    DepartmentCourseResultsView,
    DepartmentCoursesView,
    StudentPromotionActionView,
    StudentFeeStatusListView,
    PaymentListCreateView,
    DepartmentSemesterPaymentHistoryView
)
from .viewsets import DepartmentViewSet, SemesterViewSet, CourseViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'semesters', SemesterViewSet)
router.register(r'courses', CourseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Enhanced result management endpoints renamed to professional
    path("students/<int:student_id>/results/professional/", StudentResultListCreateEnhanced.as_view()),
    path("departments/<int:department_id>/courses/<int:course_id>/results/professional/", DepartmentCourseResultsView.as_view()),
    path("students/<int:student_id>/promotion/professional/", StudentPromotionActionView.as_view()),

    # Department courses endpoint
    path("departments/<int:department_id>/courses/", DepartmentCoursesView.as_view()),

    # Fee management endpoints
    path("departments/<int:department_id>/semesters/<int:semester_id>/students/fees/", StudentFeeStatusListView.as_view()),
    path("fees/<int:fee_id>/payments/", PaymentListCreateView.as_view()),
    path("departments/<int:department_id>/semesters/<int:semester_id>/payments/", DepartmentSemesterPaymentHistoryView.as_view()),
]
