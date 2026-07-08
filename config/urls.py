from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('admin-panel/', include('apps.admin.urls')),
    path('pupil/', include('apps.pupil.urls')),
]
