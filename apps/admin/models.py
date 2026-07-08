from django.db import models

from django.contrib.auth.models import User


class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    telegram_id = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}"


class TestStatus(models.Model):
    """
    Har bir test uchun umumiy holat (faolmi yoki yo‘qmi)
    """
    SUBJECT_CHOICES = [
        ('history', 'Tarix'),
        ('uzbek', 'Ona tili va adabiyot'),
        ('russian', 'Rus tili'),
    ]

    test_code = models.CharField(max_length=30, unique=True)
    subject = models.CharField(
        max_length=20,
        choices=SUBJECT_CHOICES,
        blank=True,
        default='',
        db_index=True,
    )
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    off_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.test_code


class TestAnswers(models.Model):
    """
    Admin tomonidan kiritilgan test javoblari
    """
    test_code = models.ForeignKey(TestStatus, on_delete=models.CASCADE, related_name='answers')
    question_number = models.CharField(max_length=10)
    answer_text = models.TextField()
    score = models.FloatField(default=0.0)
