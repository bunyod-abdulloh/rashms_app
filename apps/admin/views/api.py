# apps/admin/views/api.py
"""Admin JSON API endpointlar (auth talab qiladi)."""
import logging

from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import IntegrityError, transaction
from django.http import HttpRequest, JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST, require_http_methods, require_GET

from apps.admin.helpers import (
    is_admin,
    _parse_json_body,
    validate_test_code,
    validate_answers_schema,
    _save_answers_bulk,
    _infer_test_type,
    _build_answers_payload,
)
from apps.admin.models import TestAnswers, TestStatus

logger = logging.getLogger(__name__)


# ============================================================
# 💾 SAVE (POST /api/admin_save_answers/)
# ============================================================
@login_required
@user_passes_test(is_admin)
@require_POST
@csrf_protect
@never_cache
def admin_save_answers(request: HttpRequest) -> JsonResponse:
    payload, err_response = _parse_json_body(request)
    if err_response:
        return err_response

    test_code = (payload.get("test_code") or "").strip()
    answers = payload.get("answers", {})
    subject = (payload.get("subject") or "").strip() or None

    ok, err = validate_test_code(test_code)
    if not ok:
        return JsonResponse({"error": err}, status=400)

    ok, err = validate_answers_schema(answers)
    if not ok:
        return JsonResponse({"error": err}, status=400)

    if TestAnswers.objects.filter(test_code__test_code=test_code).exists():
        return JsonResponse(
            {"exists": True, "message": f'"{test_code}" test avval saqlangan.'},
            status=200,
        )

    try:
        with transaction.atomic():
            test_status, _ = TestStatus.objects.get_or_create(test_code=test_code)
            created_count = _save_answers_bulk(test_status, answers)

    except IntegrityError as exc:
        logger.warning("Integrity error on save (%s): %s", test_code, exc)
        return JsonResponse({"error": "Ma'lumotlar konflikti."}, status=409)
    except Exception as exc:
        logger.exception("Save failed for test_code=%s: %s", test_code, exc)
        return JsonResponse({"error": "Saqlashda xatolik."}, status=500)

    return JsonResponse(
        {"exists": False, "message": f"{created_count} ta javob saqlandi."},
        status=201,
    )


# ============================================================
# ✏️ UPDATE (PUT/POST /api/admin_update_answers/)
# ============================================================
@login_required
@user_passes_test(is_admin)
@require_http_methods(["PUT", "POST"])
@csrf_protect
@never_cache
def admin_update_answers(request: HttpRequest) -> JsonResponse:
    payload, err_response = _parse_json_body(request)
    if err_response:
        return err_response

    test_code = (payload.get("test_code") or "").strip()
    answers = payload.get("answers", {})

    ok, err = validate_test_code(test_code)
    if not ok:
        return JsonResponse({"error": err}, status=400)

    ok, err = validate_answers_schema(answers)
    if not ok:
        return JsonResponse({"error": err}, status=400)

    try:
        test_status = TestStatus.objects.only("id").get(test_code=test_code)
    except TestStatus.DoesNotExist:
        return JsonResponse({"error": f'"{test_code}" test topilmadi.'}, status=404)

    try:
        with transaction.atomic():
            TestAnswers.objects.filter(test_code=test_status).delete()
            created_count = _save_answers_bulk(test_status, answers)

    except Exception as exc:
        logger.exception("Update failed for test_code=%s: %s", test_code, exc)
        return JsonResponse({"error": "Saqlashda xatolik."}, status=500)

    return JsonResponse(
        {"message": f"{created_count} ta javob yangilandi."},
        status=200,
    )


# ============================================================
# 📋 LIST (GET /api/admin_tests_list/?page=1&limit=100)
# ============================================================
@login_required
@user_passes_test(is_admin)
@require_GET
def tests_list(request: HttpRequest) -> JsonResponse:
    try:
        page = max(int(request.GET.get("page", 1)), 1)
        limit = min(max(int(request.GET.get("limit", 100)), 1), 500)
    except (TypeError, ValueError):
        page, limit = 1, 100

    offset = (page - 1) * limit

    qs = TestStatus.objects.order_by("-id")
    total = qs.count()
    items = list(qs.values_list("test_code", flat=True)[offset: offset + limit])

    return JsonResponse(
        {
            "results": items,
            "page": page,
            "limit": limit,
            "total": total,
            "has_more": offset + limit < total,
        },
        status=200,
    )


# ============================================================
# 🔎 DETAIL (GET /api/admin_test_detail/?test_code=XXX)
# ============================================================
@login_required
@user_passes_test(is_admin)
@require_GET
def test_detail(request: HttpRequest) -> JsonResponse:
    test_code = (request.GET.get("test_code") or "").strip()

    ok, err = validate_test_code(test_code)
    if not ok:
        return JsonResponse({"error": err}, status=400)

    try:
        test_status = TestStatus.objects.only("id", "test_code").get(test_code=test_code)
    except TestStatus.DoesNotExist:
        return JsonResponse({"error": f'"{test_code}" test topilmadi.'}, status=404)

    answers_qs = list(
        TestAnswers.objects.filter(test_code=test_status)
        .only("question_number", "answer_text", "score")
        .order_by("question_number")
    )

    if not answers_qs:
        return JsonResponse(
            {"error": f'"{test_code}" test uchun javoblar topilmadi.'},
            status=404,
        )

    question_numbers = [str(x.question_number) for x in answers_qs]

    data = {
        "test_code": test_status.test_code,
        "type": _infer_test_type(question_numbers),
        "subject": test_status.subject,
        "answers": _build_answers_payload(answers_qs),
    }

    return JsonResponse(
        data,
        status=200,
    )
