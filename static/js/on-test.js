const testSelect      = document.getElementById('testSelect');
const testSearch      = document.getElementById('testSearch');
const selectedPreview = document.getElementById('selectedPreview');
const selectedCode    = document.getElementById('selectedCode');
const actionBtn       = document.getElementById('actionBtn');
const actionForm      = document.getElementById('actionForm');
const endDatetime     = document.getElementById('endDatetime');
const noResults       = document.getElementById('noResults');

// =====================================================
// 🔍 QIDIRISH — ishonchli DOM-based filter
// =====================================================
const OPTIONS_CACHE = testSelect
    ? Array.from(testSelect.querySelectorAll('option:not([value=""])')).map(opt => opt.cloneNode(true))
    : [];

function filterTestOptions(query) {
    const q = (query || "").toLowerCase().trim();
    const currentValue = testSelect.value;

    testSelect.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

    let matchCount = 0;
    OPTIONS_CACHE.forEach(cached => {
        const text = cached.textContent.toLowerCase();
        const code = (cached.getAttribute('data-code') || '').toLowerCase();
        if (text.includes(q) || code.includes(q)) {
            testSelect.appendChild(cached.cloneNode(true));
            matchCount++;
        }
    });

    // "Hech narsa topilmadi" ko'rsatish
    if (noResults) {
        noResults.classList.toggle('visible', q.length > 0 && matchCount === 0);
    }

    // Oldingi tanlangan hali ham mavjudmi?
    if (currentValue && testSelect.querySelector(`option[value="${currentValue}"]`)) {
        testSelect.value = currentValue;
    } else if (currentValue) {
        testSelect.value = "";
        selectedPreview?.classList.remove('active');
        updateButtonState();
    }
}

testSearch?.addEventListener('input', (e) => filterTestOptions(e.target.value));

// Escape bilan tozalash
testSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        testSearch.value = '';
        filterTestOptions('');
    }
});

// =====================================================
// 🎯 Preview + validate
// =====================================================
function updateButtonState() {
    actionBtn.disabled = !(testSelect.value && endDatetime.value);
}

testSelect?.addEventListener('change', () => {
    if (testSelect.value) {
        const code = testSelect.selectedOptions[0].getAttribute('data-code') || '';
        selectedCode.textContent = code;
        selectedPreview.classList.add('active');
    } else {
        selectedPreview.classList.remove('active');
    }
    updateButtonState();
});

endDatetime?.addEventListener('input', updateButtonState);

// Default: ertaga 18:00
if (endDatetime && !endDatetime.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    const pad = n => String(n).padStart(2, '0');
    endDatetime.value = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
}

// ⚠️ Tasdiqlash
actionForm?.addEventListener('submit', (e) => {
    const code = selectedCode.textContent;
    const confirmed = confirm(
        `🟢 "${code}" testini yoqmoqchimisiz?\n\n` +
        `Diqqat! Boshqa faol testlar avtomatik to'xtatiladi.`
    );
    if (!confirmed) {
        e.preventDefault();
        return;
    }
    actionBtn.classList.add('loading');
    actionBtn.disabled = true;
});

// ⏱️ Message auto-dismiss
setTimeout(() => {
    document.querySelectorAll('#messages .alert').forEach((alert, idx) => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            setTimeout(() => alert.remove(), 500);
        }, idx * 100);
    });
}, 5000);