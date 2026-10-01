from django.contrib import admin

from .models import TestStatus, TestAnswers, User


@admin.register(TestStatus)
class TestStatusAdmin(admin.ModelAdmin):
    list_display = ('test_code', 'subject', 'is_active', 'off_time',)
    list_filter = ('subject', 'is_active',)


@admin.register(TestAnswers)
class TestAnswersAdmin(admin.ModelAdmin):
    list_display = ('test_code', 'question_number', 'answer_text',)
    list_filter = ('test_code',)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'telegram_id', 'username', 'role',)
    list_filter = ('role',)
