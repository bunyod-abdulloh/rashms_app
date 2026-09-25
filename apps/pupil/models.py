from django.db import models

from apps.admin.models import TestStatus, User


class Pupil(models.Model):
    telegram_id = models.BigIntegerField()
    full_name = models.CharField(
        max_length=255
    )
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
    )
    is_paid = models.BooleanField(default=False)

    class Meta:
        db_table = 'users'
        managed = False


class TestResult(models.Model):
    telegram_id = models.BigIntegerField()
    test_code = models.ForeignKey(TestStatus, on_delete=models.CASCADE, related_name='results')
    question_number = models.CharField(max_length=10)
    correct_answer = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class RashResult(models.Model):
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rash_results',
    )
    pupil = models.ForeignKey(
        Pupil,
        db_column='pupil_id',
        on_delete=models.CASCADE,
    )
    test = models.ForeignKey(
        TestStatus,
        on_delete=models.CASCADE,
    )
    t1 = models.FloatField(null=True, blank=True)  # test_ball
    t2 = models.FloatField(null=True, blank=True)  # essay ball
    rasch = models.FloatField(null=True, blank=True)  # rash_ball
    percent = models.IntegerField(default=0)
    grade = models.CharField(max_length=5, null=True, blank=True)

    class Meta:
        db_table = 'rash_results'
        managed = False


class Rasch_tmp(models.Model):
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='rasch_tmp',
    )

    pupil = models.ForeignKey(
        Pupil,
        on_delete=models.CASCADE,
        related_name='rasch_tmp',
    )

    test = models.ForeignKey(
        TestStatus,
        on_delete=models.CASCADE,
        related_name='rasch_tmp',
    )

    essay_ball = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rasch_tmp'
        managed = False
