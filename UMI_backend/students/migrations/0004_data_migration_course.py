from django.db import migrations

def fix_course_data(apps, schema_editor):
    Student = apps.get_model('students', 'Student')
    Course = apps.get_model('academics', 'Course')

    for student in Student.objects.all():
        if student.course_id:
            try:
                Course.objects.get(pk=student.course_id)
            except Course.DoesNotExist:
                student.course = None
                student.save(update_fields=['course'])

class Migration(migrations.Migration):

    dependencies = [
        ('students', '0003_change_course_to_foreignkey'),
        ('academics', '0002_department_course_section'),
    ]

    operations = [
        migrations.RunPython(fix_course_data),
    ]
