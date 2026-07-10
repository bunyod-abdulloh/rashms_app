// static/js/check_answers.js
// =========================================================
// 📝 CHECK ANSWERS — Foydalanuvchi test yechish
// Subject-based rendering + backward compat + progress ring + Telegram
// =========================================================

// =========================================================
// SUBJECT CONFIG — admin bilan bir xil bo'lishi shart
// (kelajakda shared modulga ko'chirish mumkin)
// =========================================================
//const csrftoken = document
//    .querySelector('meta[name="csrf-token"]')
//    .getAttribute("content");

const SUBJECT_CONFIG = {
    history: {
        name: "Tarix",
        sections: [
            { from: 1,  to: 32, type: "abcd" },
            { from: 33, to: 35, type: "abcdef" },
            { from: 36, to: 45, type: "input-ab" },
        ],
    },
    uzbek: {
        name: "Ona tili va adabiyot",
        sections: [
            { from: 1,  to: 32, type: "abcd" },
            { from: 33, to: 35, type: "abcdef" },
            { from: 36, to: 39, type: "input-single" },
            { from: 40, to: 44, type: "input-ab" },
            { from: 45, to: 45, type: "input-single", placeholder: "Esse ballingizni yozing...", highlight: true },
        ],
    },
    russian: {
        name: "Rus tili",
        comingSoon: true,
        sections: [],
    },
};

// =========================================================
// URL PARAMS & DOM
// =========================================================
const urlParams = new URLSearchParams(window.location.search);
const codeFromUrl = urlParams.get("code");
const telegramIdFromUrl = urlParams.get("user");

const API_URL = "/pupil/api/check-answers/";

const testCodeInput      = document.getElementById("test-code");
const tbody              = document.getElementById("choices-body");
const questionsContainer = document.getElementById("questions-container");
const saveBtn            = document.getElementById("save-btn");
const statusEl           = document.getElementById("status");

// Progress ring elementlari
const progressRing  = document.querySelector('.progress-ring .fg');
const progressLabel = document.querySelector('.progress-ring .label');

// Test kodini URL'dan olish
if (codeFromUrl && testCodeInput && !testCodeInput.value) {
    testCodeInput.value = codeFromUrl;
}

// Backenddan keladigan config (window'ga yoziladi HTML script'da)
const SUBJECT        = window.TEST_SUBJECT   || "";
const QUESTION_COUNT = window.QUESTION_COUNT || 0;

// Qaysi rejim ishlaydi?
const isSubjectMode = !!(SUBJECT && SUBJECT_CONFIG[SUBJECT] && !SUBJECT_CONFIG[SUBJECT].comingSoon);


// =========================================================
// 🎨 UI BUILDERS — Subject-based (yangi)
// =========================================================

/** Jadval qatori — ABCD yoki ABCDEF */
function createRow(i, letters) {
    const tr = document.createElement("tr");
    tr.dataset.row = i;
    tr.dataset.question = i;

    const tdN = document.createElement("td");
    tdN.textContent = i;
    tdN.className = "col-n";
    tr.appendChild(tdN);

    ["A", "B", "C", "D", "E", "F"].forEach(letter => {
        const td = document.createElement("td");
        if (letters.includes(letter)) {
            const input = document.createElement("input");
            input.type = "radio";
            input.name = `choice_row_${i}`;
            input.value = letter;
            input.dataset.row = i;
            input.setAttribute("aria-label", `Savol ${i} - ${letter}`);
            td.appendChild(input);
        }
        tr.appendChild(td);
    });

    return tr;
}

/** Yagona input savol kartochkasi (36-39, 45) */
function createSingleInputBlock(i, placeholder = "Javobingizni kiriting", isEssay = false) {
    const block = document.createElement("div");
    block.className = `input-question glass-card${isEssay ? ' essay-card' : ''}`;
    block.dataset.question = i;

    const label = isEssay ? "Esse" : "Javob";

    block.innerHTML = `
        <div class="q-header">
            <span class="q-number">${i}</span>
            <span class="q-label">${label}</span>
        </div>
        <input type="text"
               class="form-control answer-input"
               data-q="${i}"
               placeholder="${placeholder}"
               autocomplete="off">
    `;

    questionsContainer.appendChild(block);
}

/** a) va b) inputlari bo'lgan savol kartochkasi (36-45 Tarix, 40-44 Ona tili) */
function createAbInputBlock(i) {
    const block = document.createElement("div");
    block.className = "input-question glass-card";
    block.dataset.question = i;

    block.innerHTML = `
        <div class="q-header">
            <span class="q-number">${i}</span>
            <span class="q-label">Javoblar</span>
        </div>
        <div class="ab-inputs">
            <div class="ab-input">
                <span class="ab-label">a)</span>
                <input type="text"
                       class="form-control answer-input"
                       data-q="${i}_a"
                       placeholder="a — javob"
                       autocomplete="off">
            </div>
            <div class="ab-input">
                <span class="ab-label">b)</span>
                <input type="text"
                       class="form-control answer-input"
                       data-q="${i}_b"
                       placeholder="b — javob"
                       autocomplete="off">
            </div>
        </div>
    `;

    questionsContainer.appendChild(block);
}


// =========================================================
// 🎨 UI BUILDERS — Old count-based (backward compat)
// =========================================================

function createOldSimpleBlock(i) {
    const block = document.createElement("div");
    block.className = "question-block mb-3";
    block.dataset.question = i;

    block.innerHTML = `
        <div class="mb-2 text-center"><label>${i}-savol:</label></div>
        <div class="text-center">
            <div id="input-wrapper-${i}" class="d-inline-flex flex-wrap justify-content-center gap-2 mb-3"></div>
        </div>
    `;

    questionsContainer.appendChild(block);
    addOldInput(i, false);
}

function createOldPlusMinusBlock(i) {
    const block = document.createElement("div");
    block.className = "question-block mb-3";
    block.dataset.question = i;

    block.innerHTML = `
        <div class="mb-2 text-center"><label>${i}-savol:</label></div>
        <div class="text-center">
            <div id="input-wrapper-${i}" class="d-inline-flex flex-wrap justify-content-center gap-2 mb-3"></div>
            <div class="d-flex justify-content-center gap-3">
                <button type="button" class="btn btn-plus" data-id="${i}"><i class="bi bi-plus-lg"></i></button>
                <button type="button" class="btn btn-minus" data-id="${i}"><i class="bi bi-dash-lg"></i></button>
            </div>
        </div>
    `;

    questionsContainer.appendChild(block);
    addOldInput(i, true);

    document.querySelector(`.btn-plus[data-id="${i}"]`)?.addEventListener("click", () => {
        addOldInput(i, true);
        updateProgress();
    });
    document.querySelector(`.btn-minus[data-id="${i}"]`)?.addEventListener("click", () => {
        removeOldInput(i);
        updateProgress();
    });
}

function addOldInput(id, useLetters = false) {
    const wrapper = document.getElementById(`input-wrapper-${id}`);
    if (!wrapper) return;

    const index = wrapper.querySelectorAll(".input-group").length;
    const group = document.createElement("div");
    group.className = "input-group d-flex align-items-center gap-2";

    if (useLetters) {
        const label = document.createElement("span");
        label.className = "fw-semibold";
        label.textContent = `${String.fromCharCode(65 + index)}.`;
        group.appendChild(label);
    }

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control text-center";
    input.placeholder = "Javobingizni kiriting";
    group.appendChild(input);
    wrapper.appendChild(group);

    if (useLetters) renumberOldInputs(id);
}

function removeOldInput(id) {
    const wrapper = document.getElementById(`input-wrapper-${id}`);
    if (!wrapper) return;

    const groups = wrapper.querySelectorAll(".input-group");
    if (groups.length > 1) {
        wrapper.removeChild(groups[groups.length - 1]);
        renumberOldInputs(id);
    }
}

function renumberOldInputs(id) {
    const groups = document.querySelectorAll(`#input-wrapper-${id} .input-group`);
    groups.forEach((group, idx) => {
        const label = group.querySelector("span");
        if (label) label.textContent = `${String.fromCharCode(65 + idx)}.`;
    });
}


// =========================================================
// 🖼️ RENDER — router
// =========================================================
function renderTest() {

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";
    questionsContainer.innerHTML = "";

    if (isSubjectMode) {
        renderBySubject(SUBJECT);
    } else {
        renderByCount();
    }

    updateProgress();
}

function renderBySubject(subject) {
    const config = SUBJECT_CONFIG[subject];

    config.sections.forEach((section) => {
        if (section.type === "abcd") {
            for (let i = section.from; i <= section.to; i++) {
                tbody.appendChild(createRow(i, ["A", "B", "C", "D"]));
            }
        } else if (section.type === "abcdef") {
            for (let i = section.from; i <= section.to; i++) {
                tbody.appendChild(createRow(i, ["A", "B", "C", "D", "E", "F"]));
            }
        } else if (section.type === "input-single") {
            const placeholder = section.placeholder || "Javobingizni kiriting";
            const isEssay = section.highlight === true;
            for (let i = section.from; i <= section.to; i++) {
                createSingleInputBlock(i, placeholder, isEssay);
            }
        } else if (section.type === "input-ab") {
            for (let i = section.from; i <= section.to; i++) {
                createAbInputBlock(i);
            }
        }
    });
}

function renderByCount() {
    const count = QUESTION_COUNT;

    if (count === 30) {
        for (let i = 1; i <= 30; i++) {
            tbody.appendChild(createRow(i, ["A", "B", "C", "D"]));
        }
    } else if (count > 40 && count < 90) {
        for (let i = 1; i <= 32; i++) {
            tbody.appendChild(createRow(i, ["A", "B", "C", "D"]));
        }
        for (let i = 33; i <= 35; i++) {
            tbody.appendChild(createRow(i, ["A", "B", "C", "D", "E", "F"]));
        }
        for (let i = 36; i <= 40; i++) {
            createOldSimpleBlock(i);
        }
        for (let i = 41; i <= count; i++) {
            createOldPlusMinusBlock(i);
        }
    } else if (count === 90) {
        for (let i = 1; i <= 90; i++) {
            tbody.appendChild(createRow(i, ["A", "B", "C", "D"]));
        }
    }
}


// =========================================================
// 📊 PROGRESS RING
// =========================================================
function updateProgress() {
    if (!progressRing || !progressLabel) return;

    let filled = 0;
    let total = 0;

    if (isSubjectMode) {
        const config = SUBJECT_CONFIG[SUBJECT];
        config.sections.forEach((section) => {
            for (let i = section.from; i <= section.to; i++) {
                total++;
                if (section.type === "abcd" || section.type === "abcdef") {
                    if (document.querySelector(`input[name="choice_row_${i}"]:checked`)) filled++;
                } else if (section.type === "input-single") {
                    const inp = document.querySelector(`input[data-q="${i}"]`);
                    if (inp?.value.trim()) filled++;
                } else if (section.type === "input-ab") {
                    const a = document.querySelector(`input[data-q="${i}_a"]`);
                    const b = document.querySelector(`input[data-q="${i}_b"]`);
                    if (a?.value.trim() && b?.value.trim()) filled++;
                }
            }
        });
    } else {
        // OLD format
        const radioNames = new Set();
        document.querySelectorAll('#choices-body input[type="radio"]').forEach(r => radioNames.add(r.name));
        radioNames.forEach(name => {
            total++;
            if (document.querySelector(`input[name="${name}"]:checked`)) filled++;
        });

        // Text input savollar (36+)
        const wrappers = document.querySelectorAll('[id^="input-wrapper-"]');
        wrappers.forEach(w => {
            total++;
            const inputs = w.querySelectorAll('input[type="text"]');
            if (inputs.length === 0) return;
            const allFilled = Array.from(inputs).every(inp => inp.value.trim());
            if (allFilled) filled++;
        });
    }

    if (total === 0) return;
    const percent = filled / total;
    progressRing.style.strokeDashoffset = 176 - 176 * percent;
    progressLabel.textContent = `${filled}/${total}`;
}


// =========================================================
// 📥 COLLECT ANSWERS
// =========================================================
function collectAnswers() {
    const answers = {};
    const missing = [];
    let essayBall = null;

    if (isSubjectMode) {
        const config = SUBJECT_CONFIG[SUBJECT];
        config.sections.forEach((section) => {
            for (let i = section.from; i <= section.to; i++) {
                if (section.type === "abcd" || section.type === "abcdef") {
                    const checked = document.querySelector(`input[name="choice_row_${i}"]:checked`);
                    if (checked) {
                        answers[i] = checked.value.toLowerCase();
                    } else {
                        missing.push(i);
                    }
                } else if (section.type === "input-single") {
                    const inp = document.querySelector(`input[data-q="${i}"]`);
                    const val = (inp?.value || "").trim();

                    if (section.highlight === true) {
                        // ⬅️ Esse balli — alohida maydon, ixtiyoriy
                        if (val) essayBall = val;
                    } else {
                        if (val) {
                            answers[i] = val.toLowerCase();
                        } else {
                            missing.push(i);
                        }
                    }
                } else if (section.type === "input-ab") {
                    const inpA = document.querySelector(`input[data-q="${i}_a"]`);
                    const inpB = document.querySelector(`input[data-q="${i}_b"]`);
                    const valA = (inpA?.value || "").trim().toLowerCase();
                    const valB = (inpB?.value || "").trim().toLowerCase();
                    if (valA && valB) {
                        answers[`${i}.a`] = valA;
                        answers[`${i}.b`] = valB;
                    } else {
                        missing.push(i);
                    }
                }
            }
        });
    } else {
        // OLD format
        const radios = document.querySelectorAll('input[type="radio"]:checked');
        radios.forEach(r => {
            answers[r.dataset.row] = r.value.toLowerCase();
        });

        // 36-40 single inputs
        if (QUESTION_COUNT === 40 || QUESTION_COUNT === 43 || (QUESTION_COUNT > 40 && QUESTION_COUNT < 90)) {
            for (let i = 36; i <= 40; i++) {
                const groups = document.querySelectorAll(`#input-wrapper-${i} .input-group`);
                if (groups.length === 0) continue;
                groups.forEach(g => {
                    const inp = g.querySelector('input');
                    const val = (inp?.value || "").trim();
                    if (val) {
                        answers[String(i)] = val.toLowerCase();
                    } else {
                        missing.push(i);
                    }
                });
            }
        }

        // 41+ plus/minus inputs
        if (QUESTION_COUNT > 40 && QUESTION_COUNT < 90) {
            for (let i = 41; i <= QUESTION_COUNT; i++) {
                const groups = document.querySelectorAll(`#input-wrapper-${i} .input-group`);
                if (groups.length === 0) continue;
                groups.forEach(g => {
                    const inp = g.querySelector('input');
                    const val = (inp?.value || "").trim();
                    const lbl = g.querySelector('span')?.textContent.replace('.', '');
                    if (val && lbl) {
                        answers[`${i}.${lbl}`] = val.toLowerCase();
                    } else {
                        missing.push(i);
                    }
                });
            }
        }
    }

    return { answers, missing, essayBall };
}


// =========================================================
// 💾 SAVE / SUBMIT
// =========================================================
saveBtn?.addEventListener("click", async () => {
    if (!testCodeInput?.value.trim()) {
        showStatus("🧩 Test kodini kiriting!", "danger");
        return;
    }

    if (!telegramIdFromUrl) {
        showStatus("⚠️ Telegram ID topilmadi!", "danger");
        return;
    }

    const { answers, missing, essayBall } = collectAnswers();

    if (missing.length > 0) {
        const uniq = [...new Set(missing)];
        const preview = uniq.slice(0, 5).join(", ");
        const more = uniq.length > 5 ? `... (+${uniq.length - 5})` : "";
        showStatus(`⚠️ To'ldirilmagan savollar: ${preview}${more}`, "warning");
        return;
    }

    saveBtn.classList.add("loading");
    saveBtn.disabled = true;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                test_code: testCodeInput.value.trim(),
                telegram_id: telegramIdFromUrl,
                answers: answers,
                essay_ball: essayBall,
            }),
        });

        const data = await res.json();

        if (data.message === "success") {
        localStorage.setItem("test_results", JSON.stringify(data.results));
        localStorage.setItem("test_stats", JSON.stringify({
            correct: data.correct,
            wrong: data.wrong,
            total: data.total,
        }));

        localStorage.setItem("test_subject", SUBJECT);
        if (essayBall) {
            localStorage.setItem("essay_ball", essayBall);
        } else {
            localStorage.removeItem("essay_ball");
        }

        window.location.href = `/pupil/results/?code=${encodeURIComponent(testCodeInput.value.trim())}`;
    } else {
            showStatus(data.error || "⚠️ Javoblarni tekshirishda xato", "danger");
        }
    } catch (err) {
        console.error(err);
        showStatus("❌ Xatolik yuz berdi", "danger");
    } finally {
        saveBtn.classList.remove("loading");
        saveBtn.disabled = false;
    }
});


// =========================================================
// 🔔 STATUS MESSAGE
// =========================================================
function showStatus(msg, type) {
    if (!statusEl) return;

    statusEl.textContent = msg;
    // Ham eski (text-*), ham yangi (alert-*) klasslar — CSS ushlaydi
    statusEl.className = `alert-${type} text-${type}`;

    if (statusEl._timeout) clearTimeout(statusEl._timeout);
    statusEl._timeout = setTimeout(() => {
        statusEl.textContent = "";
        statusEl.className = "";
    }, 5000);
}


// =========================================================
// 📱 TELEGRAM WEB APP
// =========================================================
if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    try {
        tg.setHeaderColor('#6366f1');
    } catch (e) {}
}


// =========================================================
// ⚡ EVENTS + INIT
// =========================================================
document.addEventListener('change', updateProgress);
document.addEventListener('input',  updateProgress);

// Sahifa yuklanganda testni render qilamiz
renderTest();