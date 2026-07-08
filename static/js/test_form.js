// static/js/test_form.js

// =========================================================
//  UTILS
// =========================================================
export function getCookie(name) {
  const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return match ? match.pop() : "";
}

/**
 * Status xabari — ham eski (text-*), ham yangi (alert-*) uslubda ishlaydi.
 * Premium CSS avtomatik alert-* klassni ushlaydi.
 */
export function showStatus(msg, type, elId = "status") {
  const el = document.getElementById(elId);
  if (!el) return;

  el.textContent = msg;
  // Ham eski, ham yangi klasslarni beramiz — CSS o'zi qaysini ishlatishini hal qiladi
  el.className = `alert-${type} text-${type}`;

  if (el._statusTimeout) clearTimeout(el._statusTimeout);
  el._statusTimeout = setTimeout(() => {
    el.textContent = "";
    el.className = "";
  }, 5000);
}

function getLetter(index) {
  return String.fromCharCode(65 + index);
}

// =========================================================
//  🆕 SUBJECT CONFIG (fan bo'yicha test tuzilmasi)
// =========================================================
export const SUBJECT_CONFIG = {
  history: {
    name: "Tarix",
    icon: "📚",
    totalQuestions: 45,
    sections: [
      { from: 1,  to: 32, type: "abcd",       title: "1–32: A/B/C/D" },
      { from: 33, to: 35, type: "abcdef",     title: "33–35: A/B/C/D/E/F" },
      { from: 36, to: 45, type: "input-ab",   title: "36–45: a va b javoblari" },
    ],
  },
  uzbek: {
    name: "Ona tili va adabiyot",
    icon: "📖",
    totalQuestions: 45,
    sections: [
      { from: 1,  to: 32, type: "abcd",         title: "1–32: A/B/C/D" },
      { from: 33, to: 35, type: "abcdef",       title: "33–35: A/B/C/D/E/F" },
      { from: 36, to: 39, type: "input-single", title: "36–39: yagona javob" },
      { from: 40, to: 44, type: "input-ab",     title: "40–44: a va b javoblari" },
      {
        from: 45, to: 45,
        type: "input-single",
        title: "45: Esse",
        placeholder: "Esse ballini kiriting",
        highlight: true,
      },
    ],
  },
  russian: {
    name: "Rus tili",
    icon: "🇷🇺",
    totalQuestions: 0,
    sections: [],
    comingSoon: true,
  },
};

// =========================================================
//  RENDER — subject bo'lsa yangi, type bo'lsa eski mantiq
// =========================================================
export function renderTest({ containerEl, type, subject }) {
  if (!containerEl) return;

  // 🆕 YANGI: subject bo'yicha
  if (subject !== undefined && subject !== null && subject !== "") {
    return renderBySubject({ containerEl, subject });
  }

  // ✅ ESKI (o'zgartirishsiz): type bo'yicha
  return renderByType({ containerEl, type });
}

// =========================================================
//  🆕 YANGI: subject asosida render
// =========================================================
function renderBySubject({ containerEl, subject }) {
  containerEl.innerHTML = "";
  const config = SUBJECT_CONFIG[subject];
  if (!config) return;

  if (config.comingSoon) {
    containerEl.innerHTML = `
      <div class="coming-soon glass-card text-center">
        <div class="coming-soon-icon">${config.icon}</div>
        <h5>${config.name}</h5>
        <p>Bu fan uchun test tuzilmasi tez orada qo'shiladi.</p>
      </div>
    `;
    return;
  }

  let html = "";
  let currentTable = null; // { letters, rows }

  config.sections.forEach((section) => {
    if (section.type === "abcd" || section.type === "abcdef") {
      const letters =
        section.type === "abcd"
          ? ["A", "B", "C", "D"]
          : ["A", "B", "C", "D", "E", "F"];

      // Variant soni o'zgargan bo'lsa — eski jadvalni yopamiz
      if (currentTable && currentTable.letters.length !== letters.length) {
        html += closeTable(currentTable);
        currentTable = null;
      }

      if (!currentTable) currentTable = { letters, rows: "" };

      // Section header (jadval ichidagi bo'lim)
      currentTable.rows += `
        <tr class="section-divider">
          <td colspan="${letters.length + 1}" class="section-header">
            ${section.title}
          </td>
        </tr>
      `;

      // Savol qatorlari
      for (let i = section.from; i <= section.to; i++) {
        currentTable.rows += `<tr data-question="${i}">`;
        currentTable.rows += `<td class="col-n">${i}</td>`;
        letters.forEach((letter) => {
          currentTable.rows += `<td><input type="radio" name="choice_row_${i}" data-row="${i}" value="${letter}" aria-label="Savol ${i} - ${letter}"></td>`;
        });
        currentTable.rows += `</tr>`;
      }
    } else {
      // Input savol — jadvalni yopamiz
      if (currentTable) {
        html += closeTable(currentTable);
        currentTable = null;
      }
      html += renderInputSection(section);
    }
  });

  if (currentTable) html += closeTable(currentTable);

  containerEl.innerHTML = html;
}

function closeTable({ letters, rows }) {
  const headerCells = letters.map((l) => `<th>${l}</th>`).join("");
  return `
    <div class="table-wrap fade-in-up">
      <table>
        <thead><tr><th>N°</th>${headerCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderInputSection(section) {
  let cards = "";

  for (let i = section.from; i <= section.to; i++) {
    if (section.type === "input-single") {
      const placeholder = section.placeholder || "Javobni kiriting";
      const highlight = section.highlight ? " essay-card" : "";
      const label = section.highlight ? "Esse" : "Javob";

      cards += `
        <div class="input-question glass-card${highlight}" data-question="${i}">
          <div class="q-header">
            <span class="q-number">${i}</span>
            <span class="q-label">${label}</span>
          </div>
          <input type="text"
                 class="form-control answer-input"
                 name="q${i}"
                 data-subject-q="${i}"
                 placeholder="${placeholder}"
                 autocomplete="off">
        </div>
      `;
    } else if (section.type === "input-ab") {
      cards += `
        <div class="input-question glass-card" data-question="${i}">
          <div class="q-header">
            <span class="q-number">${i}</span>
            <span class="q-label">Javoblar</span>
          </div>
          <div class="ab-inputs">
            <div class="ab-input">
              <span class="ab-label">a)</span>
              <input type="text"
                     class="form-control answer-input"
                     name="q${i}_a"
                     data-subject-q="${i}_a"
                     placeholder="a — javob"
                     autocomplete="off">
            </div>
            <div class="ab-input">
              <span class="ab-label">b)</span>
              <input type="text"
                     class="form-control answer-input"
                     name="q${i}_b"
                     data-subject-q="${i}_b"
                     placeholder="b — javob"
                     autocomplete="off">
            </div>
          </div>
        </div>
      `;
    }
  }

  return `
    <div class="input-section fade-in-up">
      <div class="section-title-mini">${section.title}</div>
      ${cards}
    </div>
  `;
}

// =========================================================
//  ✅ ESKI: type asosida render (o'zgartirishsiz)
// =========================================================
function renderByType({ containerEl, type }) {
  const t = Number(type);
  if (!containerEl) return;

  containerEl.innerHTML = "";

  const container = document.createElement("div");
  container.className = "container text-center";

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-responsive mb-4";

  const table = document.createElement("table");
  table.className = "table table-bordered align-middle";
  table.innerHTML = `
    <thead>
      <tr>
        <th>№</th>
        <th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  container.appendChild(tableWrap);

  if (t === 30) {
    for (let i = 1; i <= 30; i++) tbody.appendChild(createRow(i, ["A", "B", "C", "D"]));
  }

  if (t === 40 || t === 43) {
    for (let i = 1; i <= 32; i++) tbody.appendChild(createRow(i, ["A", "B", "C", "D"]));
    for (let i = 33; i <= 35; i++) tbody.appendChild(createRow(i, ["A", "B", "C", "D", "E", "F"]));
  }

  if (t === 90) {
    for (let i = 1; i <= 90; i++) tbody.appendChild(createRow(i, ["A", "B", "C", "D"]));
  }

  let qWrap = null;
  if (t === 40 || t === 43) {
    qWrap = document.createElement("div");
    qWrap.id = "questions-container";
    container.appendChild(qWrap);

    for (let i = 36; i <= 40; i++) {
      qWrap.appendChild(createTextQuestionBlock(i, false));
    }

    if (t === 43) {
      for (let i = 41; i <= 43; i++) {
        qWrap.appendChild(createTextQuestionBlock(i, true));
      }
    }
  }

  containerEl.appendChild(container);

  if (t === 40 || t === 43) {
    for (let i = 36; i <= 40; i++) {
      addInput(i, { useLetters: false, showLabel: false });
    }

    if (t === 43) {
      for (let i = 41; i <= 43; i++) {
        addInput(i, { useLetters: true, showLabel: true });
      }

      for (let i = 41; i <= 43; i++) {
        qWrap?.querySelector(`.btn-plus[data-id="${i}"]`)
          ?.addEventListener("click", () => addInput(i, { useLetters: true, showLabel: true }));

        qWrap?.querySelector(`.btn-minus[data-id="${i}"]`)
          ?.addEventListener("click", () => removeInput(i, { useLetters: true }));
      }
    }
  }
}

function createRow(i, letters) {
  const tr = document.createElement("tr");
  tr.dataset.question = i;

  const tdN = document.createElement("td");
  tdN.textContent = i;
  tdN.className = "col-n";
  tr.appendChild(tdN);

  ["A", "B", "C", "D", "E", "F"].forEach((letter) => {
    const td = document.createElement("td");
    if (letters.includes(letter)) {
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `choice_row_${i}`;
      input.dataset.row = i;
      input.value = letter;
      td.appendChild(input);
    }
    tr.appendChild(td);
  });

  return tr;
}

function createTextQuestionBlock(i, withButtons) {
  const block = document.createElement("div");
  block.className = "question-block mb-3";
  block.dataset.question = i;

  block.innerHTML = `
    <div class="mb-2"><label>${i}-savol:</label></div>
    <div>
      <div id="input-wrapper-${i}" class="d-inline-flex flex-wrap gap-2 mb-3"></div>
      ${
        withButtons
          ? `
        <div class="d-flex justify-content-center gap-3">
          <button type="button" class="btn btn-plus" data-id="${i}">
            <i class="bi bi-plus-lg"></i>
          </button>
          <button type="button" class="btn btn-minus" data-id="${i}">
            <i class="bi bi-dash-lg"></i>
          </button>
        </div>
      `
          : ""
      }
    </div>
  `;
  return block;
}

// =========================================================
//  ✅ ESKI: addInput / removeInput (o'zgartirishsiz)
// =========================================================
export function addInput(id, { useLetters = false, showLabel = true } = {}) {
  const wrapper = document.getElementById(`input-wrapper-${id}`);
  if (!wrapper) return;

  const count = wrapper.querySelectorAll(".input-group").length;

  const group = document.createElement("div");
  group.className = "input-group d-flex flex-column align-items-start me-3";

  const topRow = document.createElement("div");
  topRow.className = "d-flex align-items-center gap-2 w-100";

  if (showLabel) {
    const label = document.createElement("span");
    label.className = "fw-semibold";
    label.textContent = useLetters ? getLetter(count) + "." : count + 1 + ".";
    topRow.appendChild(label);
  }

  const answerInp = document.createElement("input");
  answerInp.type = "text";
  answerInp.className = "form-control text-center";
  answerInp.placeholder = "Javob...";
  answerInp.dataset.type = "answer";
  answerInp.style.width = "180px";
  answerInp.style.minWidth = "180px";

  topRow.appendChild(answerInp);
  group.appendChild(topRow);

  if ([41, 42, 43].includes(Number(id))) {
    const scoreRow = document.createElement("div");
    scoreRow.className = "mt-1 ms-4";

    const scoreInp = document.createElement("input");
    scoreInp.type = "number";
    scoreInp.min = 0;
    scoreInp.className = "form-control text-center";
    scoreInp.placeholder = "Ball";
    scoreInp.dataset.type = "score";
    scoreInp.style.width = "90px";
    scoreInp.style.minWidth = "90px";

    scoreRow.appendChild(scoreInp);
    group.appendChild(scoreRow);
  }

  wrapper.appendChild(group);

  if (useLetters) renumberInputsLetters(id);
  else renumberInputs(id);
}

export function removeInput(id, { useLetters = false } = {}) {
  const wrapper = document.getElementById(`input-wrapper-${id}`);
  if (!wrapper) return;

  const groups = wrapper.querySelectorAll(".input-group");
  if (groups.length <= 1) return;

  wrapper.removeChild(groups[groups.length - 1]);

  if (useLetters) renumberInputsLetters(id);
  else renumberInputs(id);
}

function renumberInputs(id) {
  document
    .querySelectorAll(`#input-wrapper-${id} .input-group span`)
    .forEach((label, i) => (label.textContent = i + 1 + "."));
}

function renumberInputsLetters(id) {
  document
    .querySelectorAll(`#input-wrapper-${id} .input-group span`)
    .forEach((label, i) => (label.textContent = getLetter(i) + "."));
}

// =========================================================
//  COLLECT ANSWERS — subject bo'lsa yangi, type bo'lsa eski
// =========================================================
export function collectAnswers({ type, subject }) {
  if (subject !== undefined && subject !== null && subject !== "") {
    return collectAnswersBySubject({ subject });
  }
  return collectAnswersByType({ type });
}

// =========================================================
//  🆕 YANGI: subject bo'yicha javoblarni yig'ish
// =========================================================
function collectAnswersBySubject({ subject }) {
  const config = SUBJECT_CONFIG[subject];
  const result = {
    answers: {},
    isValid: true,
    missingQuestions: [],
    total: 0,
    filled: 0,
    // eski format bilan mos bo'lishi uchun ham:
    radiosCount: 0,
    radioNeed: 0,
    allTextFilled: true,
  };

  if (!config || !config.sections.length) {
    result.isValid = false;
    return result;
  }

  config.sections.forEach((section) => {
    for (let i = section.from; i <= section.to; i++) {
      result.total++;

      if (section.type === "abcd" || section.type === "abcdef") {
        result.radioNeed++;
        const checked = document.querySelector(
          `input[type="radio"][data-row="${i}"]:checked`
        );
        if (checked) {
          result.answers[i] = checked.value.toLowerCase();
          result.filled++;
          result.radiosCount++;
        } else {
          result.missingQuestions.push(i);
        }
      } else if (section.type === "input-single") {
        const input = document.querySelector(`input[data-subject-q="${i}"]`);
        const val = input?.value.trim() || "";
        if (val) {
          result.answers[i] = val.toLowerCase();
          result.filled++;
        } else {
          result.missingQuestions.push(i);
          result.allTextFilled = false;
        }
      } else if (section.type === "input-ab") {
        const inpA = document.querySelector(`input[data-subject-q="${i}_a"]`);
        const inpB = document.querySelector(`input[data-subject-q="${i}_b"]`);
        const valA = inpA?.value.trim() || "";
        const valB = inpB?.value.trim() || "";

        if (valA && valB) {
          result.answers[`${i}.a`] = valA.toLowerCase();
          result.answers[`${i}.b`] = valB.toLowerCase();
          result.filled++;
        } else {
          result.missingQuestions.push(i);
          result.allTextFilled = false;
        }
      }
    }
  });

  result.isValid = result.missingQuestions.length === 0;
  return result;
}

// =========================================================
//  ✅ ESKI: type bo'yicha javoblarni yig'ish (o'zgartirishsiz)
// =========================================================
function collectAnswersByType({ type }) {
  const t = Number(type);
  const answers = {};
  let allTextFilled = true;

  const radios = document.querySelectorAll('input[type="radio"]:checked');
  for (const r of radios) answers[r.dataset.row] = r.value.toLowerCase();

  if (t === 40 || t === 43) {
    for (let i = 36; i <= 43; i++) {
      if (i >= 41 && i <= 43 && t !== 43) continue;

      const groups = document.querySelectorAll(`#input-wrapper-${i} .input-group`);
      for (const g of groups) {
        const answerInput = g.querySelector('input[data-type="answer"]');
        const scoreInput = g.querySelector('input[data-type="score"]');

        const v = answerInput?.value.trim();
        const s = scoreInput ? scoreInput.value.trim() : null;

        if (!v || ([41, 42, 43].includes(i) && (!s || isNaN(s)))) {
          allTextFilled = false;
          continue;
        }

        if (i <= 40) {
          answers[String(i)] = v.toLowerCase();
        } else {
          const label = g.querySelector("span")?.textContent.replace(".", "");
          answers[`${i}.${label}`] = { answer: v.toLowerCase(), score: Number(s) };
        }
      }
    }
  }

  let radioNeed = 0;
  if (t === 30) radioNeed = 30;
  if (t === 40 || t === 43) radioNeed = 35;
  if (t === 90) radioNeed = 90;

  return { answers, radiosCount: radios.length, radioNeed, allTextFilled };
}

// =========================================================
//  🆕 YANGI: Progress ring yangilash (subject bilan)
// =========================================================
export function updateProgress({ subject }) {
  const ring = document.querySelector(".progress-ring .fg");
  const label = document.querySelector(".progress-ring .label");
  if (!ring || !label) return;

  if (!subject) {
    ring.style.strokeDashoffset = 176;
    label.textContent = "0/0";
    return;
  }

  const config = SUBJECT_CONFIG[subject];
  if (!config || !config.sections.length) {
    ring.style.strokeDashoffset = 176;
    label.textContent = "0/0";
    return;
  }

  const { filled, total } = collectAnswersBySubject({ subject });
  const percent = total > 0 ? filled / total : 0;
  ring.style.strokeDashoffset = 176 - 176 * percent;
  label.textContent = `${filled}/${total}`;
}

// =========================================================
//  ✅ ESKI: PREFILL (edit_test uchun — o'zgartirishsiz)
// =========================================================
export function prefillFromAnswers({ type, answers, subject }) {
  // 🆕 YANGI: subject bo'yicha prefill
  if (subject !== undefined && subject !== null && subject !== "") {
    return prefillFromAnswersBySubject({ subject, answers });
  }

  // ✅ ESKI: type bo'yicha
  const t = Number(type);
  const a = answers || {};

  const radioLimit = t === 30 ? 30 : t === 90 ? 90 : 35;
  for (let i = 1; i <= radioLimit; i++) {
    if (a[String(i)]) setRadioAnswer(i, a[String(i)]);
  }

  if (t === 40 || t === 43) {
    for (let i = 36; i <= 40; i++) {
      if (a[String(i)]) setTextSingle(i, a[String(i)]);
    }
  }

  if (t === 43) {
    for (let q = 41; q <= 43; q++) {
      const keys = Object.keys(a).filter((k) => k.startsWith(q + "."));
      const labels = keys.map((k) => k.split(".")[1]).filter(Boolean).sort();

      const needed = Math.max(labels.length, 1);
      ensureGroupCount(q, needed);

      for (const lbl of labels) setTextScored(q, lbl, a[`${q}.${lbl}`]);
    }
  }
}

function setRadioAnswer(qNum, letterLower) {
  const letter = (letterLower || "").toUpperCase();
  const inp = document.querySelector(
    `input[type="radio"][data-row="${qNum}"][value="${letter}"]`
  );
  if (inp) inp.checked = true;
}

function setTextSingle(qNum, valueLower) {
  const wrapper = document.getElementById(`input-wrapper-${qNum}`);
  const group = wrapper?.querySelector(".input-group");
  const ans = group?.querySelector('input[data-type="answer"]');
  if (ans) ans.value = valueLower ?? "";
}

function ensureGroupCount(qNum, neededCount) {
  const wrapper = document.getElementById(`input-wrapper-${qNum}`);
  if (!wrapper) return;

  let current = wrapper.querySelectorAll(".input-group").length;
  while (current < neededCount) {
    addInput(qNum, { useLetters: true, showLabel: true });
    current++;
  }
  while (current > neededCount) {
    removeInput(qNum, { useLetters: true });
    current--;
  }
}

function setTextScored(qNum, label, obj) {
  const wrapper = document.getElementById(`input-wrapper-${qNum}`);
  const groups = wrapper?.querySelectorAll(".input-group") || [];
  const idx = label.charCodeAt(0) - 65;
  const g = groups[idx];
  if (!g) return;

  const ans = g.querySelector('input[data-type="answer"]');
  const score = g.querySelector('input[data-type="score"]');
  if (ans) ans.value = obj?.answer ?? "";
  if (score) score.value = obj?.score ?? "";
}

// =========================================================
//  🆕 YANGI: subject bo'yicha prefill (edit uchun kelajakda)
// =========================================================
function prefillFromAnswersBySubject({ subject, answers }) {
  const config = SUBJECT_CONFIG[subject];
  const a = answers || {};
  if (!config) return;

  config.sections.forEach((section) => {
    for (let i = section.from; i <= section.to; i++) {
      if (section.type === "abcd" || section.type === "abcdef") {
        if (a[i]) setRadioAnswer(i, a[i]);
      } else if (section.type === "input-single") {
        const inp = document.querySelector(`input[data-subject-q="${i}"]`);
        if (inp && a[i]) inp.value = a[i];
      } else if (section.type === "input-ab") {
        const inpA = document.querySelector(`input[data-subject-q="${i}_a"]`);
        const inpB = document.querySelector(`input[data-subject-q="${i}_b"]`);
        if (inpA && a[`${i}.a`]) inpA.value = a[`${i}.a`];
        if (inpB && a[`${i}.b`]) inpB.value = a[`${i}.b`];
      }
    }
  });
}

// =========================================================
//  ✅ ESKI: sumScores_41_43 (o'zgartirishsiz)
// =========================================================
export function sumScores_41_43() {
  let sum = 0;
  for (let q = 41; q <= 43; q++) {
    document
      .querySelectorAll(`#input-wrapper-${q} input[data-type="score"]`)
      .forEach((inp) => {
        const v = inp.value.trim();
        sum += v === "" ? 0 : Number(v);
      });
  }
  return sum;
}

// =========================================================
//  ✅ ESKI: Reset helper
// =========================================================
export function clearEl(el) {
  if (el) el.innerHTML = "";
}