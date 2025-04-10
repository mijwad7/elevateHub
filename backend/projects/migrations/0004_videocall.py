# Generated by Django 5.1.5 on 2025-04-06 19:43

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_chatsession_chatmessage"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="VideoCall",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "help_request",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="video_calls",
                        to="projects.helprequest",
                    ),
                ),
                (
                    "helper",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="video_helps",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "requester",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="video_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
