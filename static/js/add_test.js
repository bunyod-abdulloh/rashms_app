// static/js/add_test.js
import {
  getCookie,
  showStatus,
  renderTest,
  collectAnswers,
  updateProgress,
  SUBJECT_CONFIG,
} from "./test_form.js?v=2.0.0";

const API_URL = "/admin-panel/save-answers/";

const testContainer = document.getElementById("test-container");
const subjectSelect = document.getElementById("test-subject");
const saveBtn = document.getElementById("save-btn");

const csrftoken = getCookie("csrftoken");

// =========================================================
// SAQLASH
// =========================================================
async function saveAnswers() {
  const subject = subjectSelect?.value;
  const testCode = document.getElementById("test-code")?.value.trim();

  // Fan tanlangan mi?
  if (!subject) {
    return showStatus("🎓 Iltimos, avval fanni tanlang!", "warning");
  }

  const config = SUBJECT_CONFIG[subject];
  if (!config || config.comingSoon) {
    return showStatus(`${config?.name || "Bu fan"} uchun test tuzilmasi hali tayyor emas`, "warning");
  }

  // Test kodi tekshiruvi
  if (!testCode) {
    return showStatus("🧩 Test kodini kiriting!", "danger");
  }
  if (!/^[A-Za-z0-9_\-]{2,30}$/.test(testCode)) {
    return showStatus("❌ Test kodi noto'g'ri formatda!", "danger");
  }

  // Javoblarni yig'ish
  const { answers, isValid, missingQuestions } = collectAnswers({ subject });

  if (!isValid) {
    const preview = missingQuestions.slice(0, 5).join(", ");
    const more = missingQuestions.length > 5 ? `... (+${missingQuestions.length - 5})` : "";
    return showStatus(
      `⚠️ To'ldirilmagan savollar: ${preview}${more}`,
      "warning"
    );
  }

  // Saqlash
  saveBtn.classList.add("loading");
  saveBtn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({
        test_code: testCode,
        subject: subject,
        answers: answers,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) return showStatus(data.error || "❌ Saqlashda xato", "danger");
    if (data.exists) return showStatus(`⚠️ ${data.message}`, "warning");

    showStatus(`✅ ${data.message || "Test muvaffaqiyatli saqlandi!"}`, "success");
    setTimeout(() => location.reload(), 1500);
  } catch (err) {
    console.error(err);
    showStatus("❌ Xatolik yuz berdi", "danger");
  } finally {
    saveBtn.classList.remove("loading");
    saveBtn.disabled = false;
  }
}

// =========================================================
// EVENT LISTENERS
// =========================================================
saveBtn?.addEventListener("click", saveAnswers);

// Fan o'zgarganda — testni qayta chizamiz
subjectSelect?.addEventListener("change", () => {
  const subject = subjectSelect.value;
  renderTest({ containerEl: testContainer, subject });
  updateProgress({ subject });
});

// Har qanday input o'zgarganda — progress ring
document.addEventListener("change", () => {
  updateProgress({ subject: subjectSelect?.value });
});

document.addEventListener("input", () => {
  updateProgress({ subject: subjectSelect?.value });
});