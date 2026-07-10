import logging

from django.contrib.auth import authenticate, login as django_login
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie

from apps.admin.helpers import is_admin

logger = logging.getLogger(__name__)

LOGIN_TEMPLATE = "admin/login.html"
DEFAULT_REDIRECT_URL_NAME = "add-test"


def _safe_next_url(request: HttpRequest, fallback: str) -> str:
    """Open Redirect hujumidan himoya."""
    next_url = request.GET.get("next") or request.POST.get("next")

    if next_url and url_has_allowed_host_and_scheme(
            next_url,
            allowed_hosts={request.get_host()},
            require_https=request.is_secure(),
    ):
        return next_url

    return fallback


@ensure_csrf_cookie
@never_cache
def admin_login(request: HttpRequest) -> HttpResponse:
    # Login bo'lgan admin qayta login sahifasiga kirmasin
    if request.user.is_authenticated and is_admin(request.user):
        return redirect(reverse(DEFAULT_REDIRECT_URL_NAME))

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        if not username or not password:
            return render(request, LOGIN_TEMPLATE, {
                "error": "Login va parolni to'liq kiriting."
            })

        user = authenticate(
            request,
            username=username,
            password=password,
        )

        if user is None:
            return render(request, LOGIN_TEMPLATE, {
                "error": "Login yoki parol noto'g'ri."
            })

        if not user.is_active:
            return render(request, LOGIN_TEMPLATE, {
                "error": "Foydalanuvchi bloklangan."
            })

        # Admin huquqini tekshirish
        if not user.is_staff or user.role != "admin":
            return render(request, LOGIN_TEMPLATE, {
                "error": "Sizda admin panelga kirish huquqi yo'q."
            })

        django_login(request, user)

        return redirect(
            _safe_next_url(
                request,
                fallback=reverse(DEFAULT_REDIRECT_URL_NAME),
            )
        )

    return render(request, LOGIN_TEMPLATE)