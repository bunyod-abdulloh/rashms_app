from django.contrib import admin

from .models import TeacherTest


# admin.site.register(TeacherTest)

@admin.register(TeacherTest)
class TeacherTestAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'test_name', 'created_at',)
    list_filter = ('full_name',)
