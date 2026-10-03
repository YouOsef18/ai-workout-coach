export function initTelegram(onBackClick) {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        if (tg.BackButton) {
            tg.BackButton.onClick(() => {
                if (typeof onBackClick === 'function') onBackClick();
            });
        }
    }
    return tg;
}

export function haptic(type = 'light') {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
        if (['success', 'error', 'warning'].includes(type)) {
            tg.HapticFeedback.notificationOccurred(type);
        } else {
            tg.HapticFeedback.impactOccurred(type);
        }
    }
}