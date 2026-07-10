# apps/admin/views/testing.py
"""
Test-taker / WebApp API endpointlar.
Xavfsizlik: Telegram WebApp initData verify + rate limit + input validation.
"""
import json
import logging
from hashlib import sha256

import pytz
from django.db import transaction, IntegrityError, DatabaseError
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django_ratelimit.decorators import ratelimit

from apps.admin.models import TestAnswers, TestStatus
from apps.pupil.models import TestResult, RashResult, Pupil
from apps.pupil.services.grading import grade_answers
from apps.pupil.services.security import (
    require_webapp_auth,
    validate_telegram_id,
    validate_test_code,
    validate_answers,
    validate_essay_ball,
)

logger = logging.getLogger(__name__)

TASHKENT_TZ = pytz.timezone("Asia/Tashkent")


def _hash_id(tid: int) -> str:
    """Log'da telegram_id ni ochiq yozmaymiz (privacy)."""
    return sha256(str(tid).encode()).hexdigest()[:12]


def _parse_json(request: HttpRequest):
    """POST body'ni JSON qilib parse qiladi. Katta body'ni rad etadi."""
    if len(request.body) > 100_000:  # 100 KB
        return None, JsonResponse({"error": "So'rov juda katta"}, status=413)
    try:
        return json.loads(request.body), None
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "JSON format xato"}, status=400)


# Generic xato javobi — enumeratsiyani oldini olish uchun
_BAD_REQUEST = JsonResponse({"error": "Ma'lumot noto'g'ri"}, status=400)


# ============================================================
# 📡 TEST HOLATI (POST) — WebApp'dan chaqiriladi
# ============================================================
@csrf_exempt
@require_POST
@require_webapp_auth
@ratelimit(key="ip", rate="60/m", block=True)
def test_status(request: HttpRequest) -> JsonResponse:
    data, err = _parse_json(request)
    if err:
        return err

    # telegram_id endi initData'dan olinadi (ishonchli, soxtalashtirilmagan)
    telegram_id = request.verified_telegram_id
    test_code = validate_test_code(data.get("test_code"))

    if not test_code:
        return JsonResponse({"status": "error"}, status=400)

    test = TestStatus.objects.filter(test_code=test_code).first()
    if not test:
        return JsonResponse({"status": "error"}, status=404)

    # Muddati tugagan bo'lsa avtomatik o'chirish
    current_time = timezone.now().astimezone(TASHKENT_TZ)
    if test.off_time and current_time >= test.off_time and test.is_active:
        TestStatus.objects.filter(pk=test.pk, is_active=True).update(is_active=False)
        test.is_active = False

    if not test.is_active:
        if test.off_time:
            return JsonResponse({"status": "closed"}, status=200)
        return JsonResponse({"status": "not_start"}, status=200)

    user_done = TestResult.objects.filter(
        telegram_id=telegram_id, test_code=test
    ).exists()

    if user_done:
        return JsonResponse({"status": "done"}, status=200)

    return JsonResponse({"status": "new"}, status=200)


# ============================================================
# 📄 CHECK ANSWERS SAHIFASI (GET)
# ============================================================
@require_GET
@ratelimit(key="ip", rate="120/m", block=True)
def check_answers_page(request: HttpRequest):
    """
    Foydalanuvchi test kodini kiritganidan so'ng sahifani ochish.
    initData verify JS'da (sahifa yuklangach) qilinadi.
    Bu view faqat statik sahifa render qiladi.
    """
    test_code = validate_test_code(request.GET.get('code'))
    telegram_id = validate_telegram_id(request.GET.get('user'))

    if not test_code or not telegram_id:
        return render(request, 'check-answers.html', {
            'test_code': '',
            'telegram_id': '',
            'count': 0,
            'subject': '',
            'error': 'invalid_params',
        })

    subject = ''
    count = 0
    try:
        test_status_obj = TestStatus.objects.only(
            'id', 'subject', 'is_active'
        ).get(test_code=test_code)
        if test_status_obj.is_active:
            subject = getattr(test_status_obj, 'subject', '') or ''
            count = TestAnswers.objects.filter(
                test_code=test_status_obj
            ).count()
            if subject in ("uzbek", "history"):
                count = 45
    except TestStatus.DoesNotExist:
        pass

    context = {
        'test_code': test_code,
        'telegram_id': telegram_id,
        'count': count,
        'subject': subject,
    }
    return render(request, 'check-answers.html', context)


# ============================================================
# ✅ JAVOBLARNI TEKSHIRISH (POST) — WebApp'dan chaqiriladi
# ============================================================
@csrf_exempt
@require_POST
@require_webapp_auth
@ratelimit(key="ip", rate="20/m", block=True)
def check_answers(request: HttpRequest) -> JsonResponse:
    data, err = _parse_json(request)
    if err:
        return err

    # ============================================================
    # 1) INPUT VALIDATSIYA
    # ============================================================
    # telegram_id endi body'dan emas, verify qilingan initData'dan
    telegram_id = request.verified_telegram_id
    test_code = validate_test_code(data.get("test_code"))
    user_answers = validate_answers(data.get("answers"))
    essay_ball = validate_essay_ball(data.get("essay_ball"))

    if not test_code or not user_answers:
        return _BAD_REQUEST

    # ============================================================
    # 2) DB QIDIRUV — generic xato ma'lumot sizishini oldini oladi
    # ============================================================
    try:
        test_status = TestStatus.objects.get(test_code=test_code)
    except TestStatus.DoesNotExist:
        return _BAD_REQUEST

    if not test_status.is_active:
        return _BAD_REQUEST

    try:
        pupil = Pupil.objects.get(telegram_id=telegram_id)
    except Pupil.DoesNotExist:
        return _BAD_REQUEST

    # ============================================================
    # 3) BUSINESS LOGIC
    # ============================================================
    subject = getattr(test_status, "subject", "") or ""
    essay_ball_to_save = essay_ball if subject == "uzbek" else None

    try:
        with transaction.atomic():
            existing = TestResult.objects.select_for_update().filter(
                test_code=test_status, telegram_id=telegram_id
            )
            if existing.exists():
                return JsonResponse(
                    {"error": "Siz bu testni allaqachon ishlagansiz"},
                    status=409,
                )

            result = grade_answers(test_status, telegram_id, user_answers)

            TestResult.objects.bulk_create(result.bulk_records)
            RashResult.objects.get_or_create(
                pupil=pupil,
                test=test_status,
                defaults={"essay_ball": essay_ball_to_save},
            )

    except IntegrityError:
        return JsonResponse(
            {"error": "Siz bu testni allaqachon ishlagansiz"}, status=409
        )
    except DatabaseError:
        logger.exception(
            "DB error in check_answers: user=%s, test=%s",
            _hash_id(telegram_id), test_code,
        )
        return JsonResponse({"error": "Vaqtinchalik xato"}, status=503)
    except Exception:
        logger.exception(
            "Unexpected error in check_answers: user=%s, test=%s",
            _hash_id(telegram_id), test_code,
        )
        return JsonResponse({"error": "Serverda xatolik"}, status=500)

    return JsonResponse({
        "message": "success",
        "correct": result.correct,
        "wrong": result.wrong,
        "total": result.total,
        "results": result.results,
        "essay_ball": essay_ball_to_save,
    })
