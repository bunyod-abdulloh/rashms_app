const CHECK_URL = '/pupil/api/test-status/';

// =========================================================
// 🔔 TOAST HELPER — chiroyli xabar chiqarish
// =========================================================
function showToast(message, type = 'danger', icon = null) {
    const statusMsg = document.getElementById('status-msg');
    if (!statusMsg) return;

    // Default ikonkalar
    const defaultIcons = {
        danger:  'bi-x-octagon-fill',
        warning: 'bi-exclamation-triangle-fill',
        success: 'bi-check-circle-fill',
        info:    'bi-info-circle-fill',
    };
    const iconClass = icon || defaultIcons[type] || defaultIcons.info;

    // Eski toast'ni yumshoq olib tashlash
    const oldToast = statusMsg.querySelector('.toast-msg');
    if (oldToast) {
        oldToast.classList.add('leaving');
        setTimeout(() => oldToast.remove(), 300);
    }

    // Yangi toast
    setTimeout(() => {
        statusMsg.innerHTML = `
            <div class="toast-msg ${type}">
                <span class="toast-icon">
                    <i class="bi ${iconClass}"></i>
                </span>
                <span>${message}</span>
            </div>
        `;

        // Haptic feedback (Telegram)
        if (window.tgHaptic) {
            if (type === 'danger')  window.tgHaptic.error?.();
            else if (type === 'warning') window.tgHaptic.warning?.();
            else if (type === 'success') window.tgHaptic.success?.();
        }
    }, 100);
}


document.getElementById('start-btn').addEventListener('click', async () => {
    const testCode = document.getElementById('test-code').value.trim();
    const statusMsg = document.getElementById('status-msg');

    if (!testCode) {
        statusMsg.textContent = "❗ Iltimos, test kodini kiriting.";
        statusMsg.className = "text-danger fw-semibold";
        return;
    }

    // ✅ Telegram WebApp orqali foydalanuvchi ID’sini olish
    let telegram_id = null;
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        telegram_id = tg.initDataUnsafe?.user?.id;
    } else {
        alert("Telegram WebApp aniqlanmadi — test rejimida ishlayapti.");
        telegram_id = 11111; // test maqsadida vaqtinchalik ID
    }

    try {
        const res = await fetch(CHECK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id, test_code: testCode })
        });

        const data = await res.json();

        if (res.ok) {
            switch (data.status) {
                case 'closed':
                    showToast(
                        "Test muddati tugagan",
                        'danger',
                        'bi-clock-history'
                    );
                    break;

                case 'not_start':
                    showToast(
                        "Test hali boshlanmagan",
                        'warning',
                        'bi-hourglass-split'
                    );
                    break;

                case 'done':
                    showToast(
                        "Siz bu testni allaqachon ishlagansiz",
                        'info',
                        'bi-check2-all'
                    );
                    break;

                case 'new':
                    showToast("Test yuklanmoqda...", 'success', 'bi-rocket-takeoff-fill');
                    // Kichik kechikish bilan yo'naltirish (toast ko'rinsin)
                    setTimeout(() => {
                        window.location.href =
                            `/pupil/check-answers-page/?code=${encodeURIComponent(testCode)}&user=${telegram_id}`;
                    }, 600);
                    break;

                default:
                    showToast(
                        "Noma'lum xatolik yuz berdi",
                        'danger',
                        'bi-exclamation-diamond-fill'
                    );
                    break;
            }
        } else {
            statusMsg.textContent = "❌ Xatolik: " + (data.message || "Nomaʼlum sabab");
            statusMsg.className = "text-danger fw-semibold";
        }
    } catch (err) {
        console.error(err);
        statusMsg.textContent = "❌ Bog‘lanishda xato: " + err.message;
        statusMsg.className = "text-danger fw-semibold";
    }
});
