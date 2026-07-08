from django.urls import path

from apps.pupil.views import home_page, check_answers_page
from apps.pupil.views.home_result import results_page
from apps.pupil.views.testing import test_status, check_answers

urlpatterns = [
    path('home/', home_page, name='home'),
    path('check-answers-page/', check_answers_page, name='check-answers-page'),
    path('results/', results_page, name='results'),

    # API
    path('api/test-status/', test_status, name='test-status'),
    path('api/check-answers/', check_answers, name='check-answers'),
]
