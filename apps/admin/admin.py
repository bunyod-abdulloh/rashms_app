from django.contrib import admin

from .models import TestStatus, TestAnswers, User

admin.site.register(TestStatus)
admin.site.register(TestAnswers)
admin.site.register(User)
