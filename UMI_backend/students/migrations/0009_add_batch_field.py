# Generated migration for adding batch field to Student model
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('students', '0008_remove_student_course_student_semester'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='batch',
            field=models.CharField(max_length=20, null=True, blank=True),
        ),
    ]
