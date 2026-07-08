// static/js/admin/edit_test.js
import {
  getCookie,
  showStatus,
  renderTest,
  prefillFromAnswers,
  collectAnswers,
  updateProgress,
  clearEl,
  sumScores_41_43,
  SUBJECT_CONFIG,
} from "./test_form.js?v=3.0.0";

const API_LIST   = "/admin-panel/tests-list/";
const API_DETAIL = "/admin-panel/test-detail/";
const API_UPDATE = "/admin-panel/update-answers/";

const testContainer = document.getElementById("test-container");
const testSelect    = document.getElementById("test-select");
const testCodeInp   = document.getElementById("test-code");
const subjectBadge  = document.getElementById("subject-badge");
const saveBtn       = document.getElementById("save-btn");

const csrftoken = getCookie("csrftoken");

// Ruxsat etilgan test turlari (eski format uchun)
const ALLOWED_TYPES = [30, 40, 43, 90];

// =========================================================
// GLOBAL STATE
// =========================================================
let CURRENT_TEST_CODE = null;
let CURRENT_SUBJECT   = null;  // yangi format
let CURRENT_TYPE      = null;  // eski format (fallback)

// =========================================================
// RESET
// =========================================================
function resetToInitial() {
  CURRENT_TEST_CODE = null;
  CURRENT_SUBJECT   = null;
  CURRENT_TYPE      = null;

  if (testSelect)    testSelect.value = "";
  if (testCodeInp)   testCodeInp.value = "";
  if (subjectBadge)  setSubjectBadge(null);
  if (saveBtn)       saveBtn.disabled = true;

  clearEl(testContainer);

  const st = document.getElementById("status");
  if (st) { st.textContent = ""; st.className = ""; }
}

// =========================================================
// SUBJECT BADGE (🎨 vizual ko'rsatgich)
// =========================================================
function setSubjectBadge(subject) {
  if (!subjectBadge) return;

  if (!subject) {
    subjectBadge.innerHTML = "";
    subjectBadge.className = "";
    return;
  }

  const config = SUBJECT_CONFIG[subject];
  const icons = {
    history: '<i class="bi bi-book-half"></i>',
    uzbek:   '<i class="bi bi-translate"></i>',
    russian: '<i class="bi bi-globe"></i>',
  };

  subjectBadge.innerHTML = `${icons[subject] || "📚"} ${config?.name || subject}`;
  subjectBadge.className = `subject-badge ${subject}`;
}

// =========================================================
// LOAD TESTS LIST
// =========================================================
async function loadTestsList() {
  try {
    const res = await fetch(API_LIST, { credentials: "same-origin" });
    const data = await res.json();

    const items = Array.isArray(data) ? data : (data.results || []);
    for (const t of items) {
      const code = t.test_code ?? t;
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code;
      testSelect.appendChild(opt);
    }
  } catch (e) {
    console.error(e);
    showStatus("❌ Testlar ro'yxatini yuklab bo'lmadi", "danger");
  }
}

// =========================================================
// LOAD TEST DETAIL — asosiy funksiya
// Backend'dan subject yoki type keladi, ikkalasini ham qo'llaymiz
// =========================================================
async function loadTestDetail(testCode) {
  try {
    const res = await fetch(
      `${API_DETAIL}?test_code=${encodeURIComponent(testCode)}`,
      { credentials: "same-origin" }
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showStatus(data.error || "❌ Test topilmadi", "danger");
      return;
    }

    CURRENT_TEST_CODE = data.test_code;
    if (testCodeInp) testCodeInp.value = data.test_code;

    // ─────────────────────────────────────────
    // 🆕 YANGI FORMAT: subject bilan
    // ─────────────────────────────────────────
    const subject = data.subject;
    if (subject && SUBJECT_CONFIG[subject]) {
      CURRENT_SUBJECT = subject;
      CURRENT_TYPE = null;

      setSubjectBadge(subject);
      renderTest({ containerEl: testContainer, subject });

      // Render tugagach — javoblarni to'ldirish + progress
      requestAnimationFrame(() => {
        prefillFromAnswers({ subject, answers: data.answers || {} });
        updateProgress({ subject });
        saveBtn.disabled = false;
        showStatus(`✅ "${data.test_code}" yuklandi (${SUBJECT_CONFIG[subject].name})`, "success");
      });
      return;
    }

    // ─────────────────────────────────────────
    // ✅ ESKI FORMAT: type bilan (fallback)
    // ─────────────────────────────────────────
    const rawType = Number(data.type);
    if (!ALLOWED_TYPES.includes(rawType)) {
      showStatus(`❌ Noto'g'ri test turi/fan: ${data.type ?? data.subject}`, "danger");
      return;
    }

    CURRENT_TYPE = rawType;
    CURRENT_SUBJECT = null;

    setSubjectBadge(null);
    // Eski test uchun badge o'rniga type ko'rsatamiz
    if (subjectBadge) {
      subjectBadge.innerHTML = `<i class="bi bi-collection"></i> ${rawType} savol`;
      subjectBadge.className = "subject-badge type-legacy";
    }

    renderTest({ containerEl: testContainer, type: rawType });

    requestAnimationFrame(() => {
      prefillFromAnswers({ type: rawType, answers: data.answers || {} });
      saveBtn.disabled = false;
      showStatus(`✅ "${data.test_code}" yuklandi (${rawType} savol)`, "success");
    });

  } catch (e) {
    console.error(e);
    showStatus("❌ Xatolik yuz berdi (detail)", "danger");
  }
}

// =========================================================
// UPDATE ANSWERS — saqlash (PUT)
// =========================================================
async function updateAnswers() {
  if (!CURRENT_TEST_CODE) {
    showStatus("⚠️ Avval test tanlang!", "warning");
    return;
  }

  // Qaysi format ekan? Shunga ko'ra collect qilamiz
  const isSubjectMode = !!CURRENT_SUBJECT;

  const collected = isSubjectMode
    ? collectAnswers({ subject: CURRENT_SUBJECT })
    : collectAnswers({ type: CURRENT_TYPE });

  const {
    answers,
    // subject format:
    isValid, missingQuestions,
    // type format:
    radiosCount, radioNeed, allTextFilled,
  } = collected;

  // ─── Validatsiya ───
  if (isSubjectMode) {
    // Yangi format — subject
    if (!isValid) {
      const preview = missingQuestions.slice(0, 5).join(", ");
      const more = missingQuestions.length > 5
        ? `... (+${missingQuestions.length - 5})`
        : "";
      showStatus(`⚠️ To'ldirilmagan savollar: ${preview}${more}`, "warning");
      return;
    }
  } else {
    // Eski format — type
    if (radiosCount !== radioNeed || !allTextFilled) {
      showStatus("⚠️ Barcha savollar to'liq to'ldirilishi shart!", "warning");
      return;
    }
    // 41-43 ball tekshiruvi faqat type=43 uchun
    if (CURRENT_TYPE === 43) {
      const totalScore = sumScores_41_43();
      if (!Number.isFinite(totalScore) || totalScore !== 75) {
        showStatus(`⚠️ 41–43 ball yig'indisi 75 bo'lishi shart! Hozir: ${totalScore}`, "warning");
        return;
      }
    }
  }

  // ─── Saqlash ───
  saveBtn.classList.add("loading");
  saveBtn.disabled = true;

  try {
    const body = {
      test_code: CURRENT_TEST_CODE,
      answers: answers,
    };
    if (isSubjectMode) body.subject = CURRENT_SUBJECT;
    else               body.type = CURRENT_TYPE;

    const res = await fetch(API_UPDATE, {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showStatus(data.error || "❌ Saqlashda xato", "danger");
      return;
    }

    showStatus(`✅ ${data.message || "O'zgartirish saqlandi"}`, "success");
    setTimeout(() => resetToInitial(), 1500);

  } catch (e) {
    console.error(e);
    showStatus("❌ Xatolik yuz berdi (update)", "danger");
  } finally {
    saveBtn.classList.remove("loading");
    saveBtn.disabled = false;
  }
}

// =========================================================
// EVENT LISTENERS
// =========================================================
saveBtn?.addEventListener("click", updateAnswers);

testSelect?.addEventListener("change", () => {
  const code = testSelect.value;
  if (!code) {
    resetToInitial();
    return;
  }

  if (saveBtn) saveBtn.disabled = true;
  clearEl(testContainer);
  showStatus("⏳ Yuklanmoqda...", "info");

  loadTestDetail(code);
});

// Progress ring yangilash (faqat subject rejimida)
document.addEventListener("change", () => {
  if (CURRENT_SUBJECT) updateProgress({ subject: CURRENT_SUBJECT });
});

document.addEventListener("input", () => {
  if (CURRENT_SUBJECT) updateProgress({ subject: CURRENT_SUBJECT });
});

// Klaviatura yorlig'i (Ctrl+S)
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    if (!saveBtn?.disabled) saveBtn?.click();
  }
});

// =========================================================
// INIT
// =========================================================
resetToInitial();
loadTestsList();