from django.db import models

from apps.admin.models import TestStatus


class TestResult(models.Model):
    telegram_id = models.BigIntegerField()
    test_code = models.ForeignKey(TestStatus, on_delete=models.CASCADE, related_name='results')
    question_number = models.CharField(max_length=10)
    correct_answer = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
