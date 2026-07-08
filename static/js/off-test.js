const testSelect      = document.getElementById('testSelect');
const testSearch      = document.getElementById('testSearch');
const selectedPreview = document.getElementById('selectedPreview');
const selectedCode    = document.getElementById('selectedCode');
const actionBtn       = document.getElementById('actionBtn');
const actionForm      = document.getElementById('actionForm');
const endDatetime     = document.getElementById('endDatetime');
const autofillHint    = document.getElementById('autofillHint');

// 🔍 Qidirish
testSearch?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const options = testSelect.querySelectorAll('option:not([value=""])');
    options.forEach(opt => {
        const code = opt.getAttribute('data-code')?.toLowerCase() || opt.textContent.toLowerCase();
        opt.hidden = !code.includes(query);
    });
    if (testSelect.value && testSelect.selectedOptions[0]?.hidden) {
        testSelect.value = "";
        selectedPreview.classList.remove('active');
        actionBtn.disabled = true;
    }
});

// 🎯 Preview + auto-fill datetime
function updateButtonState() {
    actionBtn.disabled = !(testSelect.value && endDatetime.value);
}

testSelect?.addEventListener('change', () => {
    if (testSelect.value) {
        const opt = testSelect.selectedOptions[0];
        const code = opt.getAttribute('data-code') || '';
        const offTime = opt.getAttribute('data-offtime');

        selectedCode.textContent = code;
        selectedPreview.classList.add('active');

        // 🪄 Auto-fill: test'ning mavjud off_time'ini yozamiz
        if (offTime && offTime.trim()) {
            endDatetime.value = offTime;
            autofillHint?.classList.add('visible');
        } else {
            autofillHint?.classList.remove('visible');
        }
    } else {
        selectedPreview.classList.remove('active');
        autofillHint?.classList.remove('visible');
    }
    updateButtonState();
});

endDatetime?.addEventListener('input', () => {
    autofillHint?.classList.remove('visible');
    updateButtonState();
});

// ⚠️ Tasdiqlash
actionForm?.addEventListener('submit', (e) => {
    const code = selectedCode.textContent;
    const confirmed = confirm(
        `🟠 "${code}" testini to'xtatmoqchimisiz?\n\n` +
        `Foydalanuvchilar bundan keyin test yechishga kira olmaydilar.`
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