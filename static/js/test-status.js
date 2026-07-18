import { apiHeaders } from "./api.js";

const CHECK_URL = '/pupil/api/test-status/';

// =========================================================
// 🔔 TOAST HELPER — chiroyli xabar chiqarish
// =========================================================
const TOAST_DURATION = 10000; // 10 soniya
let toastHideTimer = null; // avtomatik yopish uchun timer ID'sini saqlaymiz

function showToast(message, type = 'danger', icon = null) {
    const statusMsg = document.getElementById('status-msg');
    if (!statusMsg) return;

    const defaultIcons = {
        danger:  'bi-x-octagon-fill',
        warning: 'bi-exclamation-triangle-fill',
        success: 'bi-check-circle-fill',
        info:    'bi-info-circle-fill',
    };
    const iconClass = icon || defaultIcons[type] || defaultIcons.info;

    // Oldingi avtomatik-yopish timerini bekor qilamiz —
    // aks holda eski toast'ning timeouti yangi toast'ni ham yopib yuboradi
    if (toastHideTimer) {
        clearTimeout(toastHideTimer);
        toastHideTimer = null;
    }

    const oldToast = statusMsg.querySelector('.toast-msg');
    if (oldToast) {
        oldToast.classList.add('leaving');
        setTimeout(() => oldToast.remove(), 300);
    }

    setTimeout(() => {
        statusMsg.innerHTML = `
            <div class="toast-msg ${type}">
                <span class="toast-icon">
                    <i class="bi ${iconClass}"></i>
                </span>
                <span>${message}</span>
            </div>
        `;

        if (window.tgHaptic) {
            if (type === 'danger')  window.tgHaptic.error?.();
            else if (type === 'warning') window.tgHaptic.warning?.();
            else if (type === 'success') window.tgHaptic.success?.();
        }

        // 10 soniyadan keyin avtomatik yopish
        toastHideTimer = setTimeout(() => {
            const activeToast = statusMsg.querySelector('.toast-msg');
            if (!activeToast) return;

            activeToast.classList.add('leaving');
            setTimeout(() => activeToast.remove(), 300);
            toastHideTimer = null;
        }, TOAST_DURATION);
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
            headers: apiHeaders(),
            body: JSON.stringify({ test_code: testCode })
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
