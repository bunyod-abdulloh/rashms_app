# apps/admin/views/pages.py
"""HTML sahifalar (add/edit/delete/on/off test)."""
import logging

from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import transaction
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect

from apps.admin.helpers import is_admin, no_cache_response
from apps.admin.models import TestStatus

logger = logging.getLogger(__name__)


@login_required
@user_passes_test(is_admin)
@never_cache
def add_test(request: HttpRequest) -> HttpResponse:
    return no_cache_response(render(request, "admin/add-test.html"))


@login_required
@user_passes_test(is_admin)
@never_cache
def edit_test(request: HttpRequest) -> HttpResponse:
    return no_cache_response(render(request, "admin/edit-test.html"))


@login_required
@user_passes_test(is_admin)
@csrf_protect
@never_cache
def delete_test_page(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        test_id = request.POST.get("test_id")

        if not test_id:
            messages.warning(request, "⚠️ Iltimos, testni tanlang.")
            return redirect("delete-test")

        try:
            test = get_object_or_404(TestStatus, id=test_id)
            test_name = test.test_code or str(test.id)
            test.delete()
            messages.success(request, f"✅ '{test_name}' testi o'chirildi.")
        except Exception as exc:
            logger.exception("Delete test failed: %s", exc)
            messages.error(request, "❌ O'chirishda xatolik yuz berdi.")

        return redirect("delete-test")

    tests = TestStatus.objects.only("id", "test_code").order_by("-id")
    return render(request, "admin/delete-test.html", {"tests": tests})


@login_required
@user_passes_test(is_admin)
@csrf_protect
@never_cache
def on_test_page(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        test_id = request.POST.get("test_id")
        end_datetime = request.POST.get("end_datetime") or None

        if not test_id:
            messages.warning(request, "Iltimos, testni tanlang.")
            return redirect("on-test")

        test = get_object_or_404(TestStatus, id=test_id)

        try:
            with transaction.atomic():
                TestStatus.objects.exclude(id=test.id).update(is_active=False)
                test.is_active = True
                test.off_time = end_datetime
                test.save(update_fields=["is_active", "off_time"])
        except Exception as exc:
            logger.exception("Enable test failed: %s", exc)
            messages.error(request, "Yoqishda xatolik yuz berdi.")
            return redirect("on-test")

        messages.success(request, f"{test.test_code} testi yoqildi!")
        return redirect("on-test")

    tests = TestStatus.objects.only("id", "test_code", "is_active").order_by("-id")
    return render(request, "admin/on-test.html", {"tests": tests})


@login_required
@user_passes_test(is_admin)
@csrf_protect
@never_cache
def off_test_page(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        test_id = request.POST.get("test_id")
        end_datetime = request.POST.get("end_datetime") or None

        if not test_id:
            messages.warning(request, "Iltimos, testni tanlang.")
            return redirect("off-test")

        test = get_object_or_404(TestStatus, id=test_id)

        try:
            test.is_active = False
            test.off_time = end_datetime
            test.save(update_fields=["is_active", "off_time"])
        except Exception as exc:
            logger.exception("Disable test failed: %s", exc)
            messages.error(request, "To'xtatishda xatolik yuz berdi.")
            return redirect("off-test")

        messages.success(request, f"{test.test_code} testi to'xtatildi!")
        return redirect("off-test")

    tests = TestStatus.objects.only("id", "test_code", "is_active").order_by("-id")
    return render(request, "admin/off-test.html", {"tests": tests})
