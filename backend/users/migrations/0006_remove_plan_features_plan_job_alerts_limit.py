# Generated by Django 5.1.4 on 2024-12-26 05:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_preferences'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='plan',
            name='features',
        ),
        migrations.AddField(
            model_name='plan',
            name='job_alerts_limit',
            field=models.IntegerField(default=0),
        ),
    ]