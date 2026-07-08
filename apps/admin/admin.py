from django.contrib import admin

from .models import AdminProfile, TestStatus,  TestAnswers

admin.site.register(AdminProfile)
admin.site.register(TestStatus)
admin.site.register(TestAnswers)
