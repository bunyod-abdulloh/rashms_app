# -----------------------
# Constants / Regex
# -----------------------
import json
import logging
import re
from typing import Any

from django.http import HttpRequest, JsonResponse
from django.utils.http import url_has_allowed_host_and_scheme

from apps.admin.models import AdminProfile, TestStatus, TestAnswers

logger = logging.getLogger(__name__)

# ============================================================
# 🔧 CONSTANTS
# ============================================================
LOGIN_TEMPLATE = "admin/login.html"
DEFAULT_REDIRECT_URL_NAME = "add-test"  # reverse() bilan olinadi
BULK_BATCH_SIZE = 200


# ============================================================
# 🔨 INTERNAL HELPERS
# ============================================================
def _parse_json_body(request: HttpRequest) -> tuple[dict | None, JsonResponse | None]:
    """Request body'ni JSON qilib parse qiladi. Xato bo'lsa (None, response) qaytaradi."""
    try:
        return json.loads(request.body), None
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "JSON formati xato"}, status=400)


def _build_answer_instances(test_status: TestStatus, answers: dict[str, Any]) -> list[TestAnswers]:
    """
    answers dict'idan TestAnswers obyektlar ro'yxatini yasaydi (INSERT qilmaydi).
    bulk_create uchun ishlatiladi.
    """
    instances = []
    for q_num, ans in answers.items():
        q_str = str(q_num)

        if isinstance(ans, str):
            instances.append(
                TestAnswers(
                    test_code=test_status,
                    question_number=q_str,
                    answer_text=ans.strip().lower(),
                    score=0.0,
                )
            )
        elif isinstance(ans, dict) and "answer" in ans:
            try:
                score = float(ans.get("score", 0))
            except (TypeError, ValueError):
                score = 0.0

            instances.append(
                TestAnswers(
                    test_code=test_status,
                    question_number=q_str,
                    answer_text=str(ans["answer"]).strip().lower(),
                    score=score,
                )
            )
        # boshqa formatlarni skip qilamiz (validate_answers_schema oldindan tekshiradi)
    return instances


def _save_answers_bulk(test_status: TestStatus, answers: dict[str, Any]) -> int:
    """
    Answers'ni bulk_create bilan saqlaydi. Har xil formatlarni qo'llab-quvvatlaydi.
    Bir marta transaction ichida — xato bo'lsa hech nima yozilmaydi.
    Qaytaradi: yozilgan javoblar soni.
    """
    instances = _build_answer_instances(test_status, answers)
    if instances:
        TestAnswers.objects.bulk_create(instances, batch_size=BULK_BATCH_SIZE)
    return len(instances)


def _safe_next_url(request: HttpRequest, fallback: str) -> str:
    """
    'next' parametrini xavfsiz tekshiradi (open redirect zaifligiga qarshi).
    Faqat shu saytning hostlariga ruxsat.
    """
    next_url = request.GET.get("next") or request.POST.get("next")
    allowed = {request.get_host()}

    if next_url and url_has_allowed_host_and_scheme(
            next_url,
            allowed_hosts=allowed,
            require_https=request.is_secure(),
    ):
        return next_url
    return fallback


TESTCODE_RE = re.compile(r'^[A-Za-z0-9_-]{1,30}$')  # allowed characters for test codes
QUESTION_KEY_RE = re.compile(r'^\d{1,3}(?:\.[A-Za-z]+)?$')  # "1", "41.A", "41A", etc.


# -----------------------
# Helpers
# -----------------------


def _infer_test_type(question_numbers: list[str]) -> int:
    """
    Saqlangan answer keylaridan test turini aniqlaydi:
    - 43: 41.A / 42.A / 43.A kabi scored subquestionlar bor
    - 40: 1..35 radio + 36..40 text
    - 90: 1..90 radio
    - 30: 1..30 radio
    """
    if any(
            q.startswith("41.") or q.startswith("42.") or q.startswith("43.")
            for q in question_numbers
    ):
        return 43

    numeric_questions = sorted(int(q) for q in question_numbers if str(q).isdigit())
    max_q = max(numeric_questions, default=0)

    has_36_40 = any(q in {"36", "37", "38", "39", "40"} for q in question_numbers)

    if has_36_40 and max_q <= 40:
        return 40

    if max_q >= 90:
        return 90

    return 30


def _build_answers_payload(answers_qs) -> dict:
    """
    DB dan frontend formatiga:
      "1": "a"
      "36": "text"
      "41.A": {"answer": "...", "score": 2}
    """
    out = {}
    for a in answers_qs:
        qn = str(a.question_number)

        out[qn] = (a.answer_text or "").strip().lower()

    return out


def is_admin(user):
    """
    True only if:
      - authenticated
      - is_staff
      - has AdminProfile row
    """
    if not (user and user.is_authenticated and user.is_staff):
        return False
    return AdminProfile.objects.filter(user=user).exists()


def validate_test_code(test_code):
    if not isinstance(test_code, str):
        return False, "test_code string bo'lishi kerak."
    if not TESTCODE_RE.match(test_code):
        return False, "test_code noto'g'ri format (faqat harf/raqam/_/- va <=30)."
    return True, None


def validate_answers_schema(answers):
    if not isinstance(answers, dict):
        return False, "answers object bo'lishi kerak."
    if not answers:
        return False, "answers bo'sh bo'lmasligi kerak."

    for k, v in answers.items():

        # ---- KEY TEKSHIRISH ----
        if not isinstance(k, str):
            return False, f"savol kaliti ({k}) string bo'lishi kerak."
        if len(k) > 300:
            return False, f"savol kaliti ({k}) juda uzun."
        if not QUESTION_KEY_RE.match(k):
            return False, f"savol kaliti ({k}) noto'g'ri formatda."

        # ---- STRING FORMAT ----
        if isinstance(v, str):
            v_str = v.strip()
            if len(v_str) == 0 or len(v_str) > 300:
                return False, f"javob ({k}) uzunligi noto'g'ri."
            continue

        # ---- JSON OBJECT FORMAT (41.A format) ----
        if isinstance(v, dict):

            if "answer" not in v or "score" not in v:
                return False, f"{k} obyektida 'answer' va 'score' bo'lishi shart."

            # answer tekshirish
            ans = v["answer"]
            if not isinstance(ans, str) or not ans.strip():
                return False, f"{k}.answer string va bo'sh bo'lmasligi kerak."
            if len(ans.strip()) > 300:
                return False, f"{k}.answer juda uzun."

            # score tekshirish
            try:
                float(v["score"])
            except (TypeError, ValueError):
                return False, f"{k}.score raqam bo'lishi kerak."

            continue

        # ---- BEGONA FORMAT ----
        return False, f"javob ({k}) noto'g'ri formatda."

    return True, None


def _clean_session_keys(session, keys):
    """Safely remove keys from session if present."""
    for k in keys:
        if k in session:
            try:
                del session[k]
            except Exception:
                logger.exception("session delete failed for key %s", k)


def no_cache_response(response):
    response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0, private"
    response["Pragma"] = "no-cache"
    response["Expires"] = "0"
    return response