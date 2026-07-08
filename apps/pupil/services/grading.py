# apps/admin/services/grading.py
"""
Test baholash (grading) logikasi.
View'dan alohida — testlash oson, boshqa joyda ham chaqirish mumkin.
"""
from dataclasses import dataclass, field
from typing import Any

from apps.admin.models import TestAnswers
from apps.pupil.models import TestResult, TestStatus


@dataclass
class GradingResult:
    """Baholash natijasi."""
    correct: int = 0
    wrong: int = 0
    total: int = 0
    results: list[dict[str, Any]] = field(default_factory=list)
    bulk_records: list[TestResult] = field(default_factory=list)


def _question_sort_key(item: dict) -> tuple[int, float]:
    """Savol raqamlarini to'g'ri tartibda saralash.
    "1", "2", "41.a", "41.b" kabi qiymatlarni qo'llab-quvvatlaydi.
    """
    try:
        parts = str(item["question"]).split(".")
        major = int(parts[0])
        minor = float("0." + parts[1]) if len(parts) > 1 else 0.0
        return (major, minor)
    except (ValueError, KeyError, IndexError):
        return (9999, 0.0)


def grade_answers(
        test_status: TestStatus,
        telegram_id: int,
        user_answers: dict[str, str],
) -> GradingResult:
    """
    Foydalanuvchining javoblarini to'g'ri javoblar bilan solishtiradi.

    Args:
        test_status: TestStatus obyekti
        telegram_id: Foydalanuvchi Telegram ID
        user_answers: Foydalanuvchi javoblari {"1": "a", "2": "b", ...}

    Returns:
        GradingResult obyekti — natijalar va bulk_create uchun record'lar.
    """
    # To'g'ri javoblarni bir marta yuklash (lower-case)
    correct_map: dict[str, str] = {
        ans.question_number: ans.answer_text.lower()
        for ans in TestAnswers.objects.filter(test_code=test_status).only(
            "question_number", "answer_text"
        )
    }

    result = GradingResult(total=len(correct_map))

    for q_num, correct_ans in correct_map.items():
        user_ans = str(user_answers.get(q_num, "")).lower().strip()
        is_correct = (correct_ans == user_ans)

        if is_correct:
            result.correct += 1
        else:
            result.wrong += 1

        result.results.append({
            "question": str(q_num),
            "user_answer": user_ans,
            "is_correct": is_correct,
        })

        result.bulk_records.append(TestResult(
            test_code=test_status,
            telegram_id=telegram_id,
            question_number=q_num,
            correct_answer=is_correct,
        ))

    # Savollarni to'g'ri tartibda saralash
    result.results.sort(key=_question_sort_key)
    return result
