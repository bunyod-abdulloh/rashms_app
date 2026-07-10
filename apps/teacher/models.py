from django.db import models

from apps.admin.models import User, TestStatus


class TeacherTest(models.Model):
    full_name = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='teachers'
    )
    test_name = models.ForeignKey(
        TestStatus, on_delete=models.CASCADE, related_name='teacher_tests'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.test_name} | {self.created_at}"
