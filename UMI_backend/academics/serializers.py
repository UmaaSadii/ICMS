from rest_framework import serializers
from .models import Attendance, Result, Fee, FeeStructure, Scholarship, Department, Semester, Course, Payment

class DepartmentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='department_id', read_only=True)
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'num_semesters']

class SemesterSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='semester_id', read_only=True)
    department = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Semester
        fields = ['id', 'name', 'semester_code', 'program', 'capacity', 'department']

class CourseSerializer(serializers.ModelSerializer):
    department_id = serializers.IntegerField(write_only=True, required=False)
    semester_number = serializers.IntegerField(write_only=True, required=False, min_value=1, max_value=8)
    semester = serializers.PrimaryKeyRelatedField(
        queryset=Semester.objects.all(), write_only=True, required=False
    )
    semester_details = SemesterSerializer(source='semester', read_only=True)

    class Meta:
        model = Course
        fields = ['course_id', 'name', 'code', 'description', 'credits', 'department_id', 'semester_number', 'semester', 'semester_details']

    def create(self, validated_data):
        department_id = validated_data.pop('department_id', None)
        semester_number = validated_data.pop('semester_number', None)
        semester_id = validated_data.pop('semester', None)

        if department_id and semester_number:
            department = Department.objects.get(pk=department_id)
            semester, created = Semester.objects.get_or_create(
                department=department,
                semester_code=f'SEM{semester_number}',
                defaults={
                    'name': f'Semester {semester_number}',
                    'program': department.name,  # or some default
                    'capacity': 30
                }
            )
            validated_data['semester'] = semester
        elif semester_id:
            validated_data['semester'] = semester_id

        return super().create(validated_data)

    def update(self, instance, validated_data):
        department_id = validated_data.pop('department_id', None)
        semester_number = validated_data.pop('semester_number', None)
        semester_id = validated_data.pop('semester', None)

        if department_id and semester_number:
            department = Department.objects.get(pk=department_id)
            semester, created = Semester.objects.get_or_create(
                department=department,
                semester_code=f'SEM{semester_number}',
                defaults={
                    'name': f'Semester {semester_number}',
                    'program': department.name,  # or some default
                    'capacity': 30
                }
            )
            validated_data['semester'] = semester
        elif semester_id:
            validated_data['semester'] = semester_id

        return super().update(instance, validated_data)

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = "__all__"
        extra_kwargs = {
            "student": {"read_only": True}  # ab student ko request body me dena zaroori nahi hoga
            }

class ResultSerializer(serializers.ModelSerializer):
    percentage = serializers.SerializerMethodField()
    course_details = serializers.SerializerMethodField()
    is_pending = serializers.SerializerMethodField()

    # Frontend-compatible fields
    id = serializers.IntegerField(source='result_id', read_only=True)
    subject = serializers.SerializerMethodField()
    marks = serializers.SerializerMethodField()
    total_marks = serializers.FloatField(read_only=True)
    obtained_marks = serializers.FloatField(read_only=True)
    gpa = serializers.SerializerMethodField()
    remarks = serializers.SerializerMethodField()

    # Write-only fields for creation/update
    course_id = serializers.IntegerField(write_only=True, required=False)
    obtained_marks_input = serializers.FloatField(write_only=True, required=False, default=0)

    class Meta:
        model = Result
        fields = ['id', 'result_id', 'subject', 'marks', 'total_marks', 'obtained_marks', 'grade', 'gpa', 'remarks', 'is_pending', 'percentage', 'course_details', 'exam_type', 'exam_date', 'course_id', 'obtained_marks_input']
        read_only_fields = ['id', 'result_id', 'subject', 'marks', 'total_marks', 'obtained_marks', 'grade', 'gpa', 'remarks', 'is_pending', 'percentage', 'course_details']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request', None)

        if request and request.method == 'GET':
            # For GET requests, return all fields including computed ones
            return fields
        else:
            # For POST/PUT/PATCH, allow frontend-compatible fields
            allowed_fields = [
                'course_id', 'exam_type', 'exam_date', 'obtained_marks_input',
                'course', 'assignment1_marks', 'assignment2_marks', 'assignment3_marks', 'mid_term_marks'
            ]
            return {k: v for k, v in fields.items() if k in allowed_fields}

    def create(self, validated_data):
        # Handle course_id to course conversion
        course_id = validated_data.pop('course_id', None)
        obtained_marks_input = validated_data.pop('obtained_marks_input', 0)
        exam_type = validated_data.get('exam_type', 'Mid')

        if course_id:
            try:
                course = Course.objects.get(course_id=course_id)
                validated_data['course'] = course
            except Course.DoesNotExist:
                raise serializers.ValidationError(f"Course with ID '{course_id}' not found")
        else:
            raise serializers.ValidationError("course_id is required")

        # Initialize all marks to 0
        validated_data['assignment1_marks'] = 0
        validated_data['assignment2_marks'] = 0
        validated_data['assignment3_marks'] = 0
        validated_data['mid_term_marks'] = 0

        # Distribute obtained marks based on exam_type
        exam_type_lower = exam_type.lower() if exam_type else ''

        if 'quiz 1' in exam_type_lower or 'assignment 1' in exam_type_lower:
            validated_data['assignment1_marks'] = obtained_marks_input
        elif 'quiz 2' in exam_type_lower or 'assignment 2' in exam_type_lower:
            validated_data['assignment2_marks'] = obtained_marks_input
        elif 'mid' in exam_type_lower:
            validated_data['mid_term_marks'] = obtained_marks_input
        elif 'final' in exam_type_lower:
            # For final exams, also use mid_term_marks since there's no separate final field
            validated_data['mid_term_marks'] = obtained_marks_input
        else:
            # Default to assignment3_marks for any other types
            validated_data['assignment3_marks'] = obtained_marks_input

        return super().create(validated_data)

    def get_course_details(self, obj):
        if obj.course:
            return {
                'course_id': obj.course.course_id,
                'name': obj.course.name,
                'code': obj.course.code,
                'credits': obj.course.credits,
            }
        return None

    def get_is_pending(self, obj):
        # Check if marks are not assigned (all mark fields are 0 or obtained_marks is 0)
        return obj.obtained_marks == 0 or (obj.quiz1_marks == 0 and obj.quiz2_marks == 0 and obj.assignment1_marks == 0 and obj.assignment2_marks == 0 and obj.mid_term_marks == 0 and obj.final_marks == 0)

    def get_subject(self, obj):
        if obj.course:
            return obj.course.name
        elif obj.exam_type:
            return f"{obj.exam_type} Exam"
        else:
            return 'General Result'

    def get_gpa(self, obj):
        """Convert grade to GPA points"""
        grade_map = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0,
            'F': 0.0
        }
        return grade_map.get(obj.grade.upper(), 0.0)

    def get_marks(self, obj):
        return f"{obj.obtained_marks}/{obj.total_marks}"

    def get_percentage(self, obj):
        return obj.percentage

    def get_remarks(self, obj):
        # Check if marks are not assigned (all mark fields are 0 or obtained_marks is 0)
        is_pending = obj.obtained_marks == 0 or (obj.quiz1_marks == 0 and obj.quiz2_marks == 0 and obj.assignment1_marks == 0 and obj.assignment2_marks == 0 and obj.mid_term_marks == 0 and obj.final_marks == 0)

        if is_pending:
            return 'Result pending'
        elif obj.grade == 'F':
            return 'Failed'
        else:
            return f'Grade: {obj.grade}'

class FeeStructureSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    semester_name = serializers.CharField(source='semester.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    fee = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"


class FeeSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    payments = PaymentSerializer(many=True, read_only=True)
    student = serializers.PrimaryKeyRelatedField(read_only=True)
    department = serializers.PrimaryKeyRelatedField(read_only=True)
    semester = serializers.PrimaryKeyRelatedField(read_only=True)

    def get_balance(self, obj):
        return float(obj.balance)

    class Meta:
        model = Fee
        fields = "__all__"


class ScholarshipSerializer(serializers.ModelSerializer):

    class Meta:
        model = Scholarship
        fields = "__all__"
# ===========================
# Student Academic History Serializer
# ===========================
class StudentAcademicHistorySerializer(serializers.Serializer):
    department = DepartmentSerializer(read_only=True)
    semester = SemesterSerializer(read_only=True)
    attendance = AttendanceSerializer(many=True, read_only=True)
    results = ResultSerializer(many=True, read_only=True)
    fee = FeeSerializer(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        fields = ['department', 'semester', 'attendance', 'results', 'fee', 'payments']        
