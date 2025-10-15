from rest_framework import generics
from .models import Department, Semester, Course, Attendance, Result, Fee, Scholarship
from .serializers import DepartmentSerializer, SemesterSerializer, CourseSerializer, AttendanceSerializer, ResultSerializer, FeeSerializer, ScholarshipSerializer
from .permissions import IsAdminOrInstructorForResultsAttendance, IsAdminRoleOrReadOnly, AllowAnyReadOnly, FeePaymentRequired
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg, Count, Q
from students.models import Student
from students.serializers import StudentSerializer
from .models import Payment
from .serializers import PaymentSerializer


class StudentResultListCreateEnhanced(generics.ListCreateAPIView):
    serializer_class = ResultSerializer
    permission_classes = [IsAdminOrInstructorForResultsAttendance]

    def get_queryset(self):
        queryset = Result.objects.filter(student_id=self.kwargs["student_id"])

        # Add filtering by department and course if provided
        department_id = self.request.query_params.get('department_id')
        course_id = self.request.query_params.get('course_id')

        if department_id:
            queryset = queryset.filter(student__department_id=department_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(student_id=self.kwargs["student_id"])

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Calculate CGPA and promotion status
        student_id = self.kwargs["student_id"]
        student = Student.objects.get(student_id=student_id)

        # Get all results for CGPA calculation
        all_results = Result.objects.filter(student_id=student_id)

        # Calculate CGPA
        cgpa_data = self.calculate_cgpa(all_results)

        # Check promotion/dropping logic with fee validation
        promotion_data = self.check_promotion_logic(student, all_results)

        # Get all assigned courses for the student (only enrolled courses)
        assigned_courses = student.courses.all()

        response_data = {
            'student': StudentSerializer(student).data,
            'results': serializer.data,
            'assigned_courses': CourseSerializer(assigned_courses, many=True).data,
            'cgpa': cgpa_data,
            'promotion_status': promotion_data
        }

        return Response(response_data)

    def calculate_cgpa(self, results):
        """Calculate CGPA from all results"""
        if not results:
            return {'cgpa': 0.0, 'total_credits': 0, 'grade_points': 0}

        total_grade_points = 0
        total_credits = 0

        for result in results:
            # Get course credits (assuming 3 credits default)
            credits = getattr(result, 'course_credits', 3) if hasattr(result, 'course_credits') else 3

            # Convert grade to grade points
            grade_points = self.grade_to_points(result.grade)
            total_grade_points += grade_points * credits
            total_credits += credits

        cgpa = total_grade_points / total_credits if total_credits > 0 else 0

        return {
            'cgpa': round(cgpa, 2),
            'total_credits': total_credits,
            'grade_points': total_grade_points
        }

    def grade_to_points(self, grade):
        """Convert letter grade to grade points"""
        grade_map = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0,
            'F': 0.0
        }
        return grade_map.get(grade.upper(), 0.0)

    def check_promotion_logic(self, student, results):
        """Check if student should be promoted or dropped"""
        from .models import Fee

        # Get final exam results (assuming exam_type contains 'final')
        final_results = results.filter(exam_type__icontains='final')

        if not final_results:
            return {'status': 'pending', 'message': 'No final results available'}

        # Check for consecutive failures
        failed_count = 0
        for result in final_results.order_by('-exam_date'):
            if result.grade.upper() == 'F':
                failed_count += 1
                if failed_count >= 3:
                    # Drop student
                    return {
                        'status': 'dropped',
                        'message': 'Student dropped due to 3 consecutive failures',
                        'action': 'drop_student'
                    }
            else:
                failed_count = 0  # Reset on pass

        # Check current semester fee payment
        current_fee = Fee.objects.filter(
            student=student,
            semester=student.semester,
            status__in=['Unpaid', 'Partial']
        ).first()

        if current_fee:
            return {
                'status': 'blocked',
                'message': f'Cannot progress - outstanding fee payment of ${current_fee.balance} required',
                'action': 'fee_payment_required'
            }

        # If no 3 consecutive failures and fees paid, promote to next semester
        current_semester = student.semester
        if current_semester:
            next_semester_num = current_semester.name.split()[-1]  # Extract number from "Semester X"
            try:
                next_semester_num = int(next_semester_num) + 1
                next_semester = Semester.objects.filter(
                    department=student.department,
                    name=f"Semester {next_semester_num}"
                ).first()

                if next_semester:
                    return {
                        'status': 'promote',
                        'message': f'Promote to {next_semester.name}',
                        'next_semester_id': next_semester.semester_id,
                        'action': 'promote_student'
                    }
            except (ValueError, TypeError):
                pass

        return {'status': 'current', 'message': 'Student remains in current semester'}


class DepartmentCoursesView(APIView):
    """Get all courses for a department"""
    permission_classes = [AllowAnyReadOnly]

    def get(self, request, department_id):
        try:
            # Get all courses for the department
            courses = Course.objects.filter(semester__department_id=department_id).select_related('semester')

            courses_data = []
            for course in courses:
                courses_data.append({
                    'id': course.course_id,
                    'name': course.name,
                    'code': course.code,
                    'description': course.description,
                    'credits': course.credits,
                    'semester': course.semester.name if course.semester else 'N/A'
                })

            return Response(courses_data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class DepartmentCourseResultsView(APIView):
    """Get results for all students in a department and course"""
    permission_classes = [IsAdminOrInstructorForResultsAttendance]

    def get(self, request, department_id, course_id):
        try:
            # Get all results for students in the department and specific course
            results = Result.objects.filter(
                student__department_id=department_id,
                course_id=course_id
            ).select_related('student', 'course', 'student__department', 'student__semester')

            results_data = []

            for result in results:
                results_data.append({
                    'id': result.result_id,
                    'student_id': result.student.student_id,
                    'student_name': result.student.name,
                    'subject': result.course.name if result.course else 'N/A',
                    'grade': result.grade,
                    'marks': f"{result.obtained_marks}/{result.total_marks}",
                    'percentage': result.percentage,
                    'semester': result.student.semester.name if result.student.semester else 'N/A',
                    'department': result.student.department.name if result.student.department else 'N/A',
                    'course': {
                        'id': result.course.course_id if result.course else None,
                        'name': result.course.name if result.course else 'N/A',
                        'code': result.course.code if result.course else 'N/A'
                    } if result.course else None
                })

            return Response(results_data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class StudentFeesListView(APIView):
    """List all fees for a specific student"""
    permission_classes = [IsAdminRoleOrReadOnly]

    def get(self, request, student_id):
        try:
            # Get the student
            student = Student.objects.get(student_id=student_id)

            # Get all fees for this student
            fees = Fee.objects.filter(student=student).select_related('department', 'semester')

            fees_data = []
            for fee in fees:
                fee_data = FeeSerializer(fee).data
                # Add department and semester names for better frontend display
                fee_data['department_name'] = fee.department.name if fee.department else 'N/A'
                fee_data['semester_name'] = fee.semester.name if fee.semester else 'N/A'
                fees_data.append(fee_data)

            return Response({
                'student_id': student_id,
                'student_name': student.name,
                'total_fees': len(fees_data),
                'fees': fees_data
            })

        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class StudentFeeStatusListView(APIView):
    """List all students in a department and semester with their fee status"""
    permission_classes = [IsAdminRoleOrReadOnly]

    def get(self, request, department_id, semester_id):
        try:
            # Get all students in the department and semester
            students = Student.objects.filter(department_id=department_id, semester_id=semester_id)

            if not students.exists():
                return Response(
                    {"error": "No students found in this department and semester combination"},
                    status=status.HTTP_404_NOT_FOUND
                )

            student_fee_data = []

            for student in students:
                # Get fee for this student, department, and semester
                fee = Fee.objects.filter(
                    student=student,
                    department_id=department_id,
                    semester_id=semester_id
                ).first()

                if fee:
                    fee_data = FeeSerializer(fee).data
                else:
                    # If no fee record exists, create a placeholder
                    fee_data = {
                        'fee_id': None,
                        'student': student.student_id,
                        'department': department_id,
                        'semester': semester_id,
                        'amount': 0,
                        'paid_amount': 0,
                        'status': 'No Fee Record',
                        'balance': 0,
                        'due_date': None,
                        'paid_on': None,
                        'payments': []
                    }

                student_data = StudentSerializer(student).data
                student_data['fee_info'] = fee_data

                student_fee_data.append(student_data)

            return Response({
                'department_id': department_id,
                'semester_id': semester_id,
                'total_students': len(student_fee_data),
                'students': student_fee_data
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentListCreateView(generics.ListCreateAPIView):
    """List and create payments for a specific fee"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminRoleOrReadOnly]

    def get_queryset(self):
        fee_id = self.kwargs.get('fee_id')
        return Payment.objects.filter(fee_id=fee_id)

    def perform_create(self, serializer):
        fee_id = self.kwargs.get('fee_id')
        fee = Fee.objects.get(fee_id=fee_id)
        serializer.save(fee=fee)

    def create(self, request, *args, **kwargs):
        """Override create method to add better error handling"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Payment creation error: {e}")
            print(f"Request data: {request.data}")
            return Response(
                {'error': f'Payment creation failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def calculate_cgpa(self, results):
        """Calculate CGPA from results"""
        if not results:
            return {'cgpa': 0.0, 'total_credits': 0, 'grade_points': 0}

        total_grade_points = 0
        total_credits = 0

        for result in results:
            credits = getattr(result, 'course_credits', 3) if hasattr(result, 'course_credits') else 3
            grade_points = self.grade_to_points(result.grade)
            total_grade_points += grade_points * credits
            total_credits += credits

        cgpa = total_grade_points / total_credits if total_credits > 0 else 0

        return {
            'cgpa': round(cgpa, 2),
            'total_credits': total_credits,
            'grade_points': total_grade_points
        }

    def grade_to_points(self, grade):
        """Convert letter grade to grade points"""
        grade_map = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0,
            'F': 0.0
        }
        return grade_map.get(grade.upper(), 0.0)

    def check_promotion_logic(self, student, results):
        """Check promotion/dropping logic"""
        final_results = results.filter(exam_type__icontains='final')

        if not final_results:
            return {'status': 'pending', 'message': 'No final results available'}

        failed_count = 0
        for result in final_results.order_by('-exam_date'):
            if result.grade.upper() == 'F':
                failed_count += 1
                if failed_count >= 3:
                    return {
                        'status': 'dropped',
                        'message': 'Student dropped due to 3 consecutive failures',
                        'action': 'drop_student'
                    }
            else:
                failed_count = 0

        # Promote logic
        current_semester = student.semester
        if current_semester:
            next_semester_num = current_semester.name.split()[-1]
            try:
                next_semester_num = int(next_semester_num) + 1
                next_semester = Semester.objects.filter(
                    department=student.department,
                    name=f"Semester {next_semester_num}"
                ).first()

                if next_semester:
                    return {
                        'status': 'promote',
                        'message': f'Promote to {next_semester.name}',
                        'next_semester_id': next_semester.semester_id,
                        'action': 'promote_student'
                    }
            except (ValueError, TypeError):
                pass

        return {'status': 'current', 'message': 'Student remains in current semester'}


class StudentPromotionActionView(APIView):
    """Handle student promotion/dropping actions"""
    permission_classes = [IsAdminRoleOrReadOnly, FeePaymentRequired]

    def post(self, request, student_id):
        try:
            student = Student.objects.get(student_id=student_id)
            action = request.data.get('action')

            if action == 'promote_student':
                next_semester_id = request.data.get('next_semester_id')
                if next_semester_id:
                    next_semester = Semester.objects.get(semester_id=next_semester_id)

                    # Reset current semester fee balance to 0 (no carry-over)
                    current_fee = Fee.objects.filter(
                        student=student,
                        semester=student.semester
                    ).first()

                    if current_fee:
                        # Clear any outstanding balance by marking as fully paid
                        current_fee.paid_amount = current_fee.amount
                        current_fee.balance = 0
                        current_fee.status = Fee.PAID
                        current_fee.save(update_fields=['paid_amount', 'balance', 'status'])

                    # Update student semester
                    student.semester = next_semester
                    student.save()

                    # Automatically create/ensure fee exists for next semester
                    from .models import Fee, FeeStructure
                    default_amount = FeeStructure.get_default_amount_for_semester(next_semester)

                    fee, created = Fee.objects.get_or_create(
                        student=student,
                        department=student.department,
                        semester=next_semester,
                        defaults={
                            'amount': default_amount,
                            'due_date': request.data.get('due_date', '2025-01-01'),  # Default due date
                            'paid_amount': 0,
                            'status': Fee.UNPAID
                        }
                    )

                    message = f'Student promoted to {next_semester.name}'
                    if current_fee:
                        message += f' - previous semester fee balance cleared'
                    if created:
                        message += f' - new fee of ${default_amount} assigned for {next_semester.name}'

                    return Response({
                        'message': message,
                        'student_id': student_id,
                        'new_semester': next_semester.name,
                        'previous_fee_cleared': current_fee is not None,
                        'fee_assigned': True,
                        'fee_amount': default_amount
                    })

            elif action == 'drop_student':
                # Mark student as dropped (you might want to add a status field to Student model)
                student.performance_notes = f"Dropped due to consecutive failures - {request.data.get('reason', '')}"
                student.save()
                return Response({
                    'message': 'Student dropped from program',
                    'student_id': student_id,
                    'status': 'dropped'
                })

            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
class DepartmentSemesterPaymentHistoryView(APIView):
    """Get all payment history for a department and semester"""
    permission_classes = [IsAdminRoleOrReadOnly]

    def get(self, request, department_id, semester_id):
        try:
            # Get all payments for fees in this department and semester
            payments = Payment.objects.filter(
                fee__department_id=department_id,
                fee__semester_id=semester_id
            ).select_related('fee__student', 'fee__semester', 'fee__department').order_by('-payment_date')

            payments_data = []
            for payment in payments:
                payments_data.append({
                    'payment_id': payment.payment_id,
                    'student_name': payment.fee.student.name,
                    'student_id': payment.fee.student.student_id,
                    'semester': payment.fee.semester.name,
                    'department': payment.fee.department.name,
                    'fee_amount': float(payment.fee.amount),
                    'payment_date': payment.payment_date,
                    'amount_paid': float(payment.amount),
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'notes': payment.notes,
                    'remaining_balance': float(payment.fee.balance),
                    'fee_status': payment.fee.status
                })

            return Response({
                'department_id': department_id,
                'semester_id': semester_id,
                'total_payments': len(payments_data),
                'payments': payments_data
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class FeeReceiptView(APIView):
    """Generate fee receipt for a specific fee"""
    permission_classes = [IsAdminRoleOrReadOnly]

    def get(self, request, fee_id):
        try:
            fee = Fee.objects.get(fee_id=fee_id)
            receipt_text = fee.receipt_text()
            return Response({
                'fee_id': fee_id,
                'receipt': receipt_text
            })
        except Fee.DoesNotExist:
            return Response(
                {'error': 'Fee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def StudentDashboardView(request, student_id):
    from students.models import Student
    from academics.models import Attendance, Result, Fee

    # Get student by student_id field (not id)
    student = Student.objects.filter(student_id=student_id).first()

    if not student:
        return Response({"error": "Student not found"}, status=404)
    # Basic student info
    student_info = {
        "student_id": student.student_id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone,
        "department": student.department.name if student.department else None,
        "semester": student.semester.name if student.semester else None,
        "cgpa": student.cgpa,
        "gpa": student.gpa,
        "attendance_percentage": student.attendance_percentage,
    }

    # Get attendance data
    attendance_records = Attendance.objects.filter(student=student)
    total_classes = attendance_records.count()
    present_classes = attendance_records.filter(status="Present").count()
    attendance_summary = {
        "total_classes": total_classes,
        "present_classes": present_classes,
        "percentage": round((present_classes / total_classes) * 100, 2) if total_classes > 0 else 0
    }

    # Get results
    results = Result.objects.filter(student=student)
    result_data = []
    for res in results:
        result_data.append({
            "course": res.course.name if res.course else None,
            "grade": res.grade,
            "marks": res.obtained_marks,
            "total_marks": res.total_marks,
            "percentage": res.percentage,
        })

    # Get fee details
    fees = Fee.objects.filter(student=student)
    fee_data = []
    for f in fees:
        fee_data.append({
            "amount": f.amount,
            "paid_amount": f.paid_amount,
            "status": f.status,
            "balance": f.balance,
            "due_date": f.due_date,
        })

    # Combine all data
    data = {
        "student_info": student_info,
        "attendance_summary": attendance_summary,
        "results": result_data,
        "fees": fee_data,
    }

    return Response(data, status=200)