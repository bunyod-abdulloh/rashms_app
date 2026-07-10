# apps/pupil/services/security.py
"""
Xavfsizlik helperlari — auth, validatsiya, rate limit.
"""
import hashlib
import hmac
import json
import logging
import time
from functools import wraps
from typing import Any
from urllib.parse import parse_qsl

from django.conf import settings
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# ============================================================
# 🔐 CONSTANTS
# ============================================================
MAX_TEST_CODE_LEN = 32
MAX_ANSWERS_COUNT = 200
MAX_ANSWER_VALUE_LEN = 100
MAX_ESSAY_BALL_LEN = 10
MIN_TELEGRAM_ID = 1
MAX_TELEGRAM_ID = 10 ** 13  # Telegram ID reallistik chegara

WEBAPP_MAX_AGE = 86400  # 24 soat — initData replay himoyasi


# ============================================================
# 🔐 TELEGRAM WEBAPP AUTH
# ============================================================
def verify_telegram_webapp(init_data: str, max_age: int = WEBAPP_MAX_AGE) -> dict | None:
    """
    Telegram WebApp initData'ni verify qiladi.
    Muvaffaqiyatli bo'lsa parsed dict qaytaradi (user ma'lumoti bilan).
    Aks holda None.
    """
    bot_token = getattr(settings, "BOT_TOKEN", None)
    if not bot_token or not init_data:
        return None

    try:
        parsed = dict(parse_qsl(init_data, strict_parsing=True))
    except ValueError:
        return None

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        return None

    # auth_date — replay attackdan himoya
    try:
        auth_date = int(parsed.get("auth_date", 0))
    except (ValueError, TypeError):
        return None
    if time.time() - auth_date > max_age:
        return None

    # HMAC hisoblash
    data_check = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode(), hashlib.sha256
    ).digest()
    expected_hash = hmac.new(
        secret_key, data_check.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        return None

    # user JSON'ni parse qilamiz
    user_raw = parsed.get("user")
    if user_raw:
        try:
            parsed["user"] = json.loads(user_raw)
        except json.JSONDecodeError:
            pass
    return parsed


def require_webapp_auth(view):
    """
    Dekorator: X-Telegram-Init-Data header'ni verify qiladi.
    Muvaffaqiyatli bo'lsa request.verified_telegram_id ga tid o'rnatiladi.
    """

    @wraps(view)
    def wrapper(request, *args, **kwargs):
        init_data = request.headers.get("X-Telegram-Init-Data", "")
        parsed = verify_telegram_webapp(init_data)
        if not parsed:
            return JsonResponse({"error": "Ruxsat yo'q"}, status=403)

        user = parsed.get("user") or {}
        tid = user.get("id")
        validated_tid = validate_telegram_id(tid) if tid else None

        if not validated_tid:
            return JsonResponse({"error": "Ruxsat yo'q"}, status=403)

        request.verified_telegram_id = validated_tid
        return view(request, *args, **kwargs)

    return wrapper


# ============================================================
# ✅ VALIDATORLAR
# ============================================================
def validate_telegram_id(value: Any) -> int | None:
    """telegram_id ni tekshiradi va integer qaytaradi. Xato bo'lsa None."""
    try:
        tid = int(value)
    except (ValueError, TypeError):
        return None
    if tid < MIN_TELEGRAM_ID or tid > MAX_TELEGRAM_ID:
        return None
    return tid


def validate_test_code(value: Any) -> str | None:
    """Test kodini tekshiradi va normallashtiradi (lower-case)."""
    if not isinstance(value, str):
        return None
    code = value.strip().lower()
    if not code or len(code) > MAX_TEST_CODE_LEN:
        return None
    # Faqat harflar, raqamlar, tire va pastki chiziq
    if not all(c.isalnum() or c in "-_" for c in code):
        return None
    return code


def validate_answers(value: Any) -> dict | None:
    """
    user_answers dict'ini tekshiradi:
    - dict bo'lishi kerak
    - Kalitlar: string, "1", "45.a" kabi
    - Qiymatlar: string, uzunligi cheklangan
    - Umumiy sig'imi cheklangan
    """
    if not isinstance(value, dict):
        return None
    if len(value) == 0 or len(value) > MAX_ANSWERS_COUNT:
        return None

    clean = {}
    for k, v in value.items():
        if not isinstance(k, str) or len(k) > 10:
            return None
        if not isinstance(v, str):
            return None
        stripped = v.strip()
        if len(stripped) == 0 or len(stripped) > MAX_ANSWER_VALUE_LEN:
            return None
        clean[k] = stripped.lower()
    return clean


def validate_essay_ball(value: Any) -> str | None:
    """
    Esse balli — string yoki None.
    Uzunligi cheklangan, faqat raqam/nuqta/vergul.
    """
    if value is None:
        return None
    if not isinstance(value, (str, int, float)):
        return None
    s = str(value).strip()
    if not s:
        return None
    if len(s) > MAX_ESSAY_BALL_LEN:
        return None
    # Faqat raqam, nuqta, vergul (masalan "8.5" yoki "8,5")
    if not all(c.isdigit() or c in ".," for c in s):
        return None
    return s


# ============================================================
# ⚠️ RATE LIMIT HANDLER
# ============================================================
def ratelimited_view(request, exception):
    """django-ratelimit RATELIMIT_VIEW handleri."""
    return JsonResponse(
        {"error": "Juda ko'p so'rov, biroz kuting"}, status=429
    )
