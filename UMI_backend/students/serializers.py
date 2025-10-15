from rest_framework import serializers
from .models import Student
from academics.models import Course
from academics.serializers import CourseSerializer, FeeSerializer

class StudentSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    courses = CourseSerializer(many=True, read_only=True)
    department_id = serializers.IntegerField(required=False, allow_null=True)
    semester_id = serializers.IntegerField(required=False, allow_null=True)

    def get_id(self, obj):
        return obj.student_id

    def get_department(self, obj):
        if obj.department:
            return {
                'id': obj.department.department_id,
                'name': obj.department.name,
                'code': obj.department.code,
                'description': obj.department.description,
                'num_semesters': obj.department.num_semesters,
            }
        return None

    def get_semester(self, obj):
        if obj.semester:
            return {
                'id': obj.semester.semester_id,
                'name': obj.semester.name,
                'semester_code': obj.semester.semester_code,
                'program': obj.semester.program,
                'capacity': obj.semester.capacity,
                'department': obj.semester.department.department_id if obj.semester.department else None,
            }
        return None

    def get_department_id(self, obj):
        return obj.department.department_id if obj.department else None


    def _assign_semester_courses(self, student):
        """
        Automatically assign all courses of the student's semester to the student
        """
        import logging
        logger = logging.getLogger(__name__)

        if not student.semester:
            logger.warning(f"Student {student.name} (ID: {student.student_id}) has no semester assigned. Skipping course assignment.")
            return

        try:
            # Get all courses for this semester - use the semester object directly
            semester_courses = Course.objects.filter(semester=student.semester)

            # Get current courses before assignment for logging
            current_course_ids = set(student.courses.values_list('course_id', flat=True))
            new_course_ids = set(semester_courses.values_list('course_id', flat=True))

            # Assign courses to student
            student.courses.set(semester_courses)

            # Log the assignment
            course_names = [course.name for course in semester_courses]
            logger.info(f"Student {student.name} (ID: {student.student_id}) enrolled in semester {student.semester.name} with {semester_courses.count()} courses: {course_names}")

            # Log changes if any
            added_courses = new_course_ids - current_course_ids
            removed_courses = current_course_ids - new_course_ids

            if added_courses:
                added_course_names = list(Course.objects.filter(course_id__in=added_courses).values_list('name', flat=True))
                logger.info(f"Added courses to student {student.name}: {added_course_names}")

            if removed_courses:
                removed_course_names = list(Course.objects.filter(course_id__in=removed_courses).values_list('name', flat=True))
                logger.info(f"Removed courses from student {student.name}: {removed_course_names}")

        except Exception as e:
            logger.error(f"Error assigning courses to student {student.name} (ID: {student.student_id}): {str(e)}")
            raise

    def validate(self, data):
        # Debug: Print the incoming data
        print(f"StudentSerializer validate - Incoming data: {data}")

        # Ensure required fields are provided
        required_fields = ['email', 'department_id']
        for field in required_fields:
            if field not in data or not data[field]:
                print(f"Missing required field: {field}")
                raise serializers.ValidationError(f"{field} is required")

        # Ensure either name or (first_name and last_name) are provided
        if not data.get('name') and not (data.get('first_name') and data.get('last_name')):
            print("Missing name or first_name/last_name")
            raise serializers.ValidationError("Either 'name' or both 'first_name' and 'last_name' are required")

        # Guardian information is optional - don't require it
        guardian_name = data.get('guardian_name')
        father_guardian = data.get('father_guardian')

        print(f"Guardian validation - guardian_name: '{guardian_name}', father_guardian: '{father_guardian}'")
        print("Guardian information is optional - validation passed")

        print("Validation passed successfully")
        return data

    def create(self, validated_data):
        from academics.models import Department, Semester

        # Handle department_id
        department_id = validated_data.pop('department_id', None)
        if department_id:
            try:
                validated_data['department'] = Department.objects.get(pk=department_id)
            except Department.DoesNotExist:
                raise serializers.ValidationError(f"Department with id {department_id} does not exist")

        # Handle semester_id
        semester_id = validated_data.pop('semester_id', None)
        if semester_id:
            try:
                validated_data['semester'] = Semester.objects.get(pk=semester_id)
            except Semester.DoesNotExist:
                raise serializers.ValidationError(f"Semester with id {semester_id} does not exist")

        # If first_name and last_name are provided, combine them into name
        if 'first_name' in validated_data and 'last_name' in validated_data:
            first_name = validated_data.get('first_name', '')
            last_name = validated_data.get('last_name', '')
            validated_data['name'] = f"{first_name} {last_name}".strip()

        # If name is not provided but first_name and last_name are, use them
        if 'name' not in validated_data or not validated_data['name']:
            if 'first_name' in validated_data and 'last_name' in validated_data:
                first_name = validated_data.get('first_name', '')
                last_name = validated_data.get('last_name', '')
                validated_data['name'] = f"{first_name} {last_name}".strip()

        # Set defaults for phone and date_of_birth if not provided
        if 'phone' not in validated_data or not validated_data['phone']:
            validated_data['phone'] = 'N/A'
        if 'date_of_birth' not in validated_data or not validated_data['date_of_birth']:
            from datetime import date
            validated_data['date_of_birth'] = date.today()

        # Handle guardian_name - convert string 'null' to actual null
        if 'guardian_name' in validated_data:
            if validated_data['guardian_name'] == 'null' or validated_data['guardian_name'] == '':
                validated_data['guardian_name'] = None
            else:
                validated_data['father_guardian'] = validated_data['guardian_name']

        # Handle guardian_contact - convert string 'null' to actual null
        if 'guardian_contact' in validated_data and (validated_data['guardian_contact'] == 'null' or validated_data['guardian_contact'] == ''):
            validated_data['guardian_contact'] = None

        # Handle address - convert string 'null' to actual null
        if 'address' in validated_data and (validated_data['address'] == 'null' or validated_data['address'] == ''):
            validated_data['address'] = None

        # Handle blood_group - convert string 'null' to actual null
        if 'blood_group' in validated_data and (validated_data['blood_group'] == 'null' or validated_data['blood_group'] == ''):
            validated_data['blood_group'] = None

        # Handle department and semester fields - convert 0 to None
        if 'department' in validated_data and validated_data['department'] == 0:
            validated_data['department'] = None
        if 'semester' in validated_data and validated_data['semester'] == 0:
            validated_data['semester'] = None

        # Create the student
        student = super().create(validated_data)

        # Automatically assign courses based on semester
        self._assign_semester_courses(student)

        return student

    def update(self, instance, validated_data):
        from academics.models import Department, Semester

        # Handle department_id
        department_id = validated_data.pop('department_id', None)
        if department_id:
            try:
                validated_data['department'] = Department.objects.get(pk=department_id)
            except Department.DoesNotExist:
                raise serializers.ValidationError(f"Department with id {department_id} does not exist")

        # Handle semester_id
        semester_id = validated_data.pop('semester_id', None)
        if semester_id:
            try:
                validated_data['semester'] = Semester.objects.get(pk=semester_id)
            except Semester.DoesNotExist:
                raise serializers.ValidationError(f"Semester with id {semester_id} does not exist")

        # If first_name and last_name are provided, combine them into name
        if 'first_name' in validated_data and 'last_name' in validated_data:
            first_name = validated_data.get('first_name', '')
            last_name = validated_data.get('last_name', '')
            validated_data['name'] = f"{first_name} {last_name}".strip()

        # Handle guardian_name - convert string 'null' to actual null
        if 'guardian_name' in validated_data:
            if validated_data['guardian_name'] == 'null' or validated_data['guardian_name'] == '':
                validated_data['guardian_name'] = None
            else:
                validated_data['father_guardian'] = validated_data['guardian_name']

        # Handle guardian_contact - convert string 'null' to actual null
        if 'guardian_contact' in validated_data and (validated_data['guardian_contact'] == 'null' or validated_data['guardian_contact'] == ''):
            validated_data['guardian_contact'] = None

        # Handle address - convert string 'null' to actual null
        if 'address' in validated_data and (validated_data['address'] == 'null' or validated_data['address'] == ''):
            validated_data['address'] = None

        # Handle blood_group - convert string 'null' to actual null
        if 'blood_group' in validated_data and (validated_data['blood_group'] == 'null' or validated_data['blood_group'] == ''):
            validated_data['blood_group'] = None

        # Handle department and semester fields - convert 0 to None
        if 'department' in validated_data and validated_data['department'] == 0:
            validated_data['department'] = None
        if 'semester' in validated_data and validated_data['semester'] == 0:
            validated_data['semester'] = None

        # Update the student
        student = super().update(instance, validated_data)

        # Check if semester was changed and reassign courses if needed
        if 'semester' in validated_data or 'semester_id' in validated_data:
            self._assign_semester_courses(student)

        return student

    class Meta:
        model = Student
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True},  # Don't include password in responses
            'name': {'required': False},  # Make name not required since we'll generate it
            'father_guardian': {'required': False},  # Make father_guardian not required since we'll map it
            'student_id': {'read_only': True},  # student_id is auto-generated
        }
