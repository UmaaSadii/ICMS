from django.db import migrations, models
import django.db.models.deletion

def migrate_course_code_to_fk(apps, schema_editor):
    Student = apps.get_model('students', 'Student')
    Course = apps.get_model('academics', 'Course')
    Department = apps.get_model('academics', 'Department')

    for student in Student.objects.all():
        course_code = student.course_code
        if course_code:
            try:
                course = Course.objects.get(code=course_code)
                student.course_id = course.pk
                student.save(update_fields=['course'])
            except Course.DoesNotExist:
                # Create the course if it doesn't exist
                department, created = Department.objects.get_or_create(
                    code='CS',
                    defaults={
                        'name': 'Computer Science',
                        'description': 'Computer Science Department'
                    }
                )
                course, created = Course.objects.get_or_create(
                    code=course_code,
                    defaults={
                        'name': f'Course {course_code}',
                        'description': f'Course {course_code}',
                        'department': department
                    }
                )
                student.course_id = course.pk
                student.save(update_fields=['course'])

def reverse_migration(apps, schema_editor):
    Student = apps.get_model('students', 'Student')
    for student in Student.objects.all():
        if student.course:
            student.course_code = student.course.code
            student.save(update_fields=['course_code'])
        else:
            student.course_code = None
            student.save(update_fields=['course_code'])

class Migration(migrations.Migration):

    dependencies = [
        ('students', '0002_alter_student_course'),
        ('academics', '0002_department_course_section'),
    ]

    operations = [
        migrations.RunPython(migrate_course_code_to_fk, reverse_migration),
        migrations.RemoveField(
            model_name='student',
            name='course_code',
        ),
    ]
