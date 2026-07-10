export function apiHeaders() {
    const initData = window.Telegram?.WebApp?.initData || "";
    return {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": initData,
    };
}