# Generated manually for adding quiz marks fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0015_result_final_marks'),
    ]

    operations = [
        migrations.AddField(
            model_name='result',
            name='quiz1_marks',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='result',
            name='quiz2_marks',
            field=models.FloatField(default=0),
        ),
        migrations.RemoveField(
            model_name='result',
            name='assignment3_marks',
        ),
    ]