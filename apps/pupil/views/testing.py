# apps/admin/views/testing.py
"""
Test-taker / Bot API endpointlar.
Bu view'lar admin emas, oddiy foydalanuvchi (yoki Telegram bot) chaqirishi mumkin.
Shuning uchun @csrf_exempt va auth talab qilinmaydi.
"""
import json
import logging

import pytz
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET

from apps.admin.models import TestAnswers, TestStatus
from apps.pupil.models import TestResult
from apps.pupil.services.grading import grade_answers

logger = logging.getLogger(__name__)

TASHKENT_TZ = pytz.timezone("Asia/Tashkent")


def _parse_json(request: HttpRequest):
    """POST body'ni JSON qilib parse qiladi."""
    try:
        return json.loads(request.body), None
    except json.JSONDecodeError:
        return None, JsonResponse(
            {"status": "error", "message": "JSON format xato"}, status=400
        )


# ============================================================
# 📡 TEST HOLATI (POST)
# ============================================================
@csrf_exempt
@require_POST
def test_status(request: HttpRequest) -> JsonResponse:
    data, err = _parse_json(request)
    if err:
        return err

    telegram_id = data.get("telegram_id")
    test_code = data.get("test_code").lower()

    if not telegram_id or not test_code:
        return JsonResponse(
            {"status": "error", "message": "Ma'lumot yetarli emas"}, status=400
        )

    try:
        telegram_id = int(telegram_id)
    except (ValueError, TypeError):
        return JsonResponse(
            {"status": "error"}, status=400)

    test = TestStatus.objects.filter(test_code=test_code).first()

    if not test:
        return JsonResponse(
            {"status": "error"}, status=404
        )

    # Muddati tugagan bo'lsa avtomatik o'chirish
    current_time = timezone.now().astimezone(TASHKENT_TZ)
    if test.off_time and current_time >= test.off_time:
        test.is_active = False
        test.save(update_fields=["is_active"])

    if not test.is_active:
        if test.off_time:
            return JsonResponse(
                {"status": "closed"}, status=200)
        return JsonResponse(
            {"status": "not_start"}, status=200
        )

    # Foydalanuvchi allaqachon ishlaganmi?
    user_done = TestResult.objects.filter(
        telegram_id=telegram_id, test_code=test
    ).exists()

    if user_done:
        return JsonResponse(
            {"status": "done"}, status=200,
        )

    return JsonResponse(
        {"status": "new"}, status=200,
    )


# ============================================================
# 📄 CHECK ANSWERS SAHIFASI (GET)
# ============================================================
@require_GET
def check_answers_page(request: HttpRequest):
    """
    Foydalanuvchi test kodini kiritganidan so'ng sahifani ochish.
    Endi subject ham uzatiladi — frontend to'g'ri render qilishi uchun.
    """
    test_code = request.GET.get('code')
    telegram_id = request.GET.get('user')

    # ⬇️ Subject'ni olishga urinamiz (model'da subject field bo'lsa)
    subject = ''
    try:
        test_status = TestStatus.objects.only('id', 'subject').get(test_code=test_code)
        subject = getattr(test_status, 'subject', '') or ''
    except (TestStatus.DoesNotExist, AttributeError):
        # subject field hali qo'shilmagan bo'lsa yoki test topilmasa — bo'sh
        pass

    count = TestAnswers.objects.filter(test_code__test_code=test_code).count()

    if subject == "uzbek" or subject == "history":
        count = 45

    context = {
        'test_code': test_code,
        'telegram_id': telegram_id,
        'count': count,
        'subject': subject,
    }

    return render(request, 'check-answers.html', context)


# ============================================================
# ✅ JAVOBLARNI TEKSHIRISH (POST)
# ============================================================
@csrf_exempt
@require_POST
def check_answers(request: HttpRequest) -> JsonResponse:
    data, err = _parse_json(request)
    if err:
        return JsonResponse({"error": "JSON format xato"}, status=400)

    test_code = data.get("test_code")
    telegram_id = data.get("telegram_id")
    user_answers = data.get("answers", {})

    if not test_code or not telegram_id or not user_answers:
        return JsonResponse({"error": "Ma'lumot to'liq emas"}, status=400)

    try:
        telegram_id = int(telegram_id)
    except (ValueError, TypeError):
        return JsonResponse({"error": "telegram_id noto'g'ri"}, status=400)

    try:
        test_status = TestStatus.objects.get(test_code=test_code)
    except TestStatus.DoesNotExist:
        return JsonResponse({"error": "Bunday test topilmadi"}, status=404)

    try:
        with transaction.atomic():
            # Lock — bir vaqtda ikki marta yozishni oldini olish
            existing = TestResult.objects.select_for_update().filter(
                test_code=test_status, telegram_id=telegram_id
            )
            if existing.exists():
                return JsonResponse(
                    {"error": "Siz bu testni allaqachon ishlagansiz"}, status=400
                )

            # 🎯 Business logic — service'ga vazifa berdik
            result = grade_answers(test_status, telegram_id, user_answers)

            # DB'ga bir marta yozish
            TestResult.objects.bulk_create(result.bulk_records)

    except Exception:
        logger.exception("check_answers failed for test_code=%s", test_code)
        return JsonResponse({"error": "Serverda xatolik yuz berdi"}, status=500)

    return JsonResponse(
        {
            "message": "success",
            "correct": result.correct,
            "wrong": result.wrong,
            "total": result.total,
            "results": result.results,
        }
    )
