// static/js/telegram_theme.js
// =========================================================
// 📱 TELEGRAM WEB APP THEME INTEGRATION
// Telegram foydalanuvchi tanlagan tema (yorug'/qorong'i/custom)
// avtomatik ravishda CSS variables'ga o'rnatiladi.
// =========================================================

(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    // 1️⃣ Web App'ni tayyorlash
    tg.ready();
    tg.expand();

    // 2️⃣ Header rangini brand rangga o'rnatish
    try {
        // Foydalanuvchi custom tema ishlatsa uni saqlaymiz
        tg.setHeaderColor(tg.colorScheme === 'dark' ? '#1a1a2e' : '#fbfaff');
        tg.setBackgroundColor(tg.colorScheme === 'dark' ? '#0d0d18' : '#fbfaff');
    } catch (e) {
        console.warn('setHeaderColor not supported:', e);
    }

    // 3️⃣ Telegram theme paramlarini CSS variablarga uzatish
    function applyTelegramTheme() {
        const tp = tg.themeParams || {};
        const root = document.documentElement;

        // Agar Telegram custom rang bergan bo'lsa, ishlatamiz
        if (tp.bg_color) {
            root.style.setProperty('--tg-bg-color', tp.bg_color);
            // Bizning bg-page ni ham moslashtiramiz (lekin faqat asosan)
            // root.style.setProperty('--bg-page', tp.bg_color);
        }
        if (tp.text_color) {
            root.style.setProperty('--tg-text-color', tp.text_color);
        }
        if (tp.hint_color) {
            root.style.setProperty('--tg-hint-color', tp.hint_color);
        }
        if (tp.link_color) {
            root.style.setProperty('--tg-link-color', tp.link_color);
        }
        if (tp.button_color) {
            root.style.setProperty('--tg-button-color', tp.button_color);
        }
        if (tp.button_text_color) {
            root.style.setProperty('--tg-button-text-color', tp.button_text_color);
        }
        if (tp.secondary_bg_color) {
            root.style.setProperty('--tg-secondary-bg-color', tp.secondary_bg_color);
        }

        // Klass qo'shamiz — CSS'da .tg-theme selector bilan foydalanish uchun
        root.classList.add('tg-theme');
        root.classList.toggle('tg-dark', tg.colorScheme === 'dark');
        root.classList.toggle('tg-light', tg.colorScheme === 'light');
    }

    applyTelegramTheme();

    // 4️⃣ Tema o'zgarganda avtomatik yangilash
    tg.onEvent('themeChanged', applyTelegramTheme);

    // 5️⃣ Viewport o'zgarishida (klaviatura ochilganda)
    tg.onEvent('viewportChanged', () => {
        document.documentElement.style.setProperty(
            '--tg-viewport-height',
            `${tg.viewportHeight}px`
        );
        document.documentElement.style.setProperty(
            '--tg-viewport-stable-height',
            `${tg.viewportStableHeight}px`
        );
    });

    // 6️⃣ Foydalanuvchi ma'lumotini olish (agar kerak bo'lsa)
    window.TG_USER = tg.initDataUnsafe?.user || null;

    // 7️⃣ Haptic feedback helper (native tuyg'u)
    window.tgHaptic = {
        light:    () => tg.HapticFeedback?.impactOccurred('light'),
        medium:   () => tg.HapticFeedback?.impactOccurred('medium'),
        heavy:    () => tg.HapticFeedback?.impactOccurred('heavy'),
        success:  () => tg.HapticFeedback?.notificationOccurred('success'),
        warning:  () => tg.HapticFeedback?.notificationOccurred('warning'),
        error:    () => tg.HapticFeedback?.notificationOccurred('error'),
        selection: () => tg.HapticFeedback?.selectionChanged(),
    };

    // 8️⃣ Debug (development uchun)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('📱 Telegram WebApp initialized:', {
            version: tg.version,
            platform: tg.platform,
            colorScheme: tg.colorScheme,
            themeParams: tg.themeParams,
            viewportHeight: tg.viewportHeight,
        });
    }
})();