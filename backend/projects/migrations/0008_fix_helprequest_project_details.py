from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0007_alter_notification_options_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='helprequest',
            name='project_details',
        ),
    ] 