from django.urls import path

from apps.admin.views.api import admin_save_answers, admin_update_answers, tests_list, test_detail
from apps.admin.views.auth import admin_login
from apps.admin.views.pages import add_test, delete_test_page, edit_test, off_test_page, on_test_page

urlpatterns = [
    path('login/', admin_login, name='login'),
    path('add-test/', add_test, name='add-test', ),
    path('edit-test/', edit_test, name='edit-test', ),
    path('delete-test/', delete_test_page, name='delete-test', ),
    path('off-test/', off_test_page, name='off-test', ),
    path('on-test/', on_test_page, name='on-test', ),

    # API
    path('save-answers/', admin_save_answers, name='admin-save-answers'),
    path('update-answers/', admin_update_answers, name='admin-update-answers'),
    path('tests-list/', tests_list, name='tests-list'),
    path('test-detail/', test_detail, name='test-detail'),

]
