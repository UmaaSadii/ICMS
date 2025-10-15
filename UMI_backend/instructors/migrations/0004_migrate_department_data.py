from django.db import migrations

def migrate_department_data(apps, schema_editor):
    Instructor = apps.get_model('instructors', 'Instructor')
    Department = apps.get_model('academics', 'Department')

    for instructor in Instructor.objects.all():
        if instructor.department and isinstance(instructor.department, str):
            try:
                department_obj = Department.objects.get(name=instructor.department)
                instructor.department = department_obj
                instructor.save(update_fields=['department'])
            except Department.DoesNotExist:
                # No matching department found, set to None or log
                instructor.department = None
                instructor.save(update_fields=['department'])

class Migration(migrations.Migration):

    dependencies = [
        ('instructors', '0003_alter_instructor_department_and_more'),
        ('academics', '0002_department_course_section'),
    ]

    operations = [
        migrations.RunPython(migrate_department_data),
    ]
