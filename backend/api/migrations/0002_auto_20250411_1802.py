from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="CustomUser",
            name="otp_secret",
            field=models.CharField(max_length=32, blank=True, null=True),
        ),
    ]