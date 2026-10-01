from django.contrib import admin

from .models import Pupil, TestResult, RashResult, Rasch_tmp


@admin.register(Pupil)
class PupilAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'teacher', 'is_paid', 'telegram_id',)
    list_filter = ('is_paid', 'teacher',)


@admin.register(TestResult)
class TestResultAdmin(admin.ModelAdmin):
    list_display = ('test_code__test_code', 'question_number', 'correct_answer', 'telegram_id',)
    list_filter = ('test_code__test_code', 'telegram_id',)


@admin.register(RashResult)
class RashResultAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'pupil', 'test', 'grade',)
    list_filter = ('teacher', 'pupil', 'test', 'grade',)


@admin.register(Rasch_tmp)
class Rasch_tmpAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'pupil', 'test', 'essay_ball',)
    list_filter = ('teacher', 'pupil', 'test',)
