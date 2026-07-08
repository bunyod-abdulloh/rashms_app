const testSelect      = document.getElementById('testSelect');
const testSearch      = document.getElementById('testSearch');
const selectedPreview = document.getElementById('selectedPreview');
const selectedCode    = document.getElementById('selectedCode');
const deleteBtn       = document.getElementById('deleteBtn');
const deleteForm      = document.getElementById('deleteForm');

// =====================================================
// 🔍 Qidirish (jonli filter)
// =====================================================
testSearch?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const options = testSelect.querySelectorAll('option:not([value=""])');

    options.forEach(opt => {
        const match = opt.textContent.toLowerCase().includes(query);
        opt.hidden = !match;
    });

    // Agar tanlangan variant filtrdan chiqib ketsa — reset
    if (testSelect.value && testSelect.selectedOptions[0]?.hidden) {
        testSelect.value = "";
        selectedPreview.classList.remove('active');
        deleteBtn.disabled = true;
    }
});

// =====================================================
// 🎯 Test tanlanganda preview ko'rsatish
// =====================================================
testSelect?.addEventListener('change', () => {
    if (testSelect.value) {
        const selectedText = testSelect.options[testSelect.selectedIndex].textContent;
        selectedCode.textContent = selectedText;
        selectedPreview.classList.add('active');
        deleteBtn.disabled = false;
    } else {
        selectedPreview.classList.remove('active');
        deleteBtn.disabled = true;
    }
});

// =====================================================
// ⚠️ Tasdiqlash — noto'g'ri o'chirishning oldini olish
// =====================================================
deleteForm?.addEventListener('submit', (e) => {
    const testName = selectedCode.textContent;

    const confirmed = confirm(
        `⚠️ "${testName}" testini butunlay o'chirmoqchimisiz?\n\n` +
        `Bu amalni QAYTARIB BO'LMAYDI!\n` +
        `Test bilan bog'liq barcha javoblar ham o'chadi.`
    );

    if (!confirmed) {
        e.preventDefault();
        return;
    }

    // Loading holati
    deleteBtn.classList.add('loading');
    deleteBtn.disabled = true;
});

// =====================================================
// ⏱️ Message'larni 5 soniyadan keyin avtomatik yashirish
// =====================================================
setTimeout(() => {
    document.querySelectorAll('#messages .alert').forEach((alert, idx) => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            setTimeout(() => alert.remove(), 500);
        }, idx * 100);
    });
}, 5000);