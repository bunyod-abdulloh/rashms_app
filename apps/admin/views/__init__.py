# apps/admin/views/__init__.py
"""
Views paketi. Barcha view'lar bu yerdan re-export qilinadi,
shuning uchun `from apps.admin.views import admin_login` kabi importlar
o'zgarishsiz ishlaydi (URL patterns o'zgartirishsiz qoladi).
"""

# 🔌 Admin API (JSON, auth talab qiladi)
from apps.admin.views.api import (
    admin_save_answers,
    admin_update_answers,
    tests_list,
    test_detail,
)
# 🔐 Auth
from apps.admin.views.auth import admin_login
# 📄 Sahifalar (HTML)
from apps.admin.views.pages import (
    add_test,
    edit_test,
    delete_test_page,
    on_test_page,
    off_test_page,
)

__all__ = [
    # auth
    "admin_login",
    # pages
    "add_test",
    "edit_test",
    "delete_test_page",
    "on_test_page",
    "off_test_page",
    # admin api
    "admin_save_answers",
    "admin_update_answers",
    "tests_list",
    "test_detail",
]
