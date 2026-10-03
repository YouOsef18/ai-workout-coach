import { state } from '../state.js';
import { fetchMonthStatusApi } from '../api.js';
import { updateDraftButtonVisibility } from '../services/storage.js';
import { openDateModal } from './strength.js';

const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

export async function loadMonthData() {
    const year = state.currentDate.getFullYear();
    const month = String(state.currentDate.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}-${month}`;
    try {
        const data = await fetchMonthStatusApi(yearMonth);
        state.calendarMarkers = {};
        data.forEach(item => { state.calendarMarkers[item.date] = item; });
    } catch (e) {
        console.error("Ошибка загрузки дат:", e);
        state.calendarMarkers = {};
    }
    renderCalendar();
    updateDraftButtonVisibility();
}

export function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    document.getElementById('calendar-title').innerText = `${monthNames[month]} ${year}`;
    
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = "";
    
    for (let i = 0; i < firstDayIndex; i++) { 
        daysContainer.appendChild(document.createElement('div')); 
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        const fullDate = `${year}-${monthStr}-${dayStr}`;
        
        const btn = document.createElement('button');
        btn.className = `day-btn ${fullDate === todayStr ? 'today' : ''}`;
        
        const status = state.calendarMarkers[fullDate];

        let pressTimer;
        let isLongPress = false;

        const startPress = () => {
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                if (status && (status.has_strength || status.has_cardio)) {
                    state.selectedDateStr = fullDate;
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
                    }
                    document.getElementById('confirm-modal').classList.remove('hidden');
                }
            }, 600);
        };

        const cancelPress = () => clearTimeout(pressTimer);

        btn.addEventListener('touchstart', startPress, {passive: true});
        btn.addEventListener('mousedown', startPress);
        btn.addEventListener('touchend', cancelPress);
        btn.addEventListener('mouseup', cancelPress);
        btn.addEventListener('touchmove', cancelPress, {passive: true});
        btn.addEventListener('mouseleave', cancelPress);

        btn.onclick = (e) => {
            if (isLongPress) {
                e.preventDefault();
                return; 
            }

            if (status && status.has_strength) {
                openDateModal(fullDate); 
            } else if (status && status.has_cardio) {
                alert("Здесь скоро появится экран просмотра результатов кардио!");
            } else {
                if (window.cardioAppInstance) {
                    window.cardioAppInstance.openDateSelector(fullDate);
                } else {
                    openDateModal(fullDate);
                }
            }
        };

        let markersHtml = '<div class="dot-placeholder"></div>';
        if (status) {
            markersHtml = '<div style="display:flex; gap:2px; margin-top:4px;">';
            if (status.has_strength) markersHtml += '<div class="workout-dot" style="background:var(--accent); box-shadow:0 0 6px var(--accent);"></div>';
            if (status.has_cardio) markersHtml += '<div class="workout-dot" style="background:var(--danger); box-shadow:0 0 6px var(--danger);"></div>';
            markersHtml += '</div>';
        }

        btn.innerHTML = `<span>${day}</span>${markersHtml}`;
        daysContainer.appendChild(btn);
    }
}

export async function changeMonth(delta) {
    const container = document.getElementById('calendar-days');
    const tempDate = new Date(state.currentDate); 
    tempDate.setMonth(tempDate.getMonth() + delta);
    document.getElementById('calendar-title').innerText = `${monthNames[tempDate.getMonth()]} ${tempDate.getFullYear()}`;
    container.classList.add(delta > 0 ? 'calendar-slide-left' : 'calendar-slide-right');
    setTimeout(async () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + delta);
        await loadMonthData();
        container.style.transition = 'none';
        container.classList.remove('calendar-slide-left', 'calendar-slide-right');
        container.classList.add(delta > 0 ? 'calendar-slide-right' : 'calendar-slide-left');
        container.offsetHeight;
        container.style.transition = '';
        container.classList.remove('calendar-slide-left', 'calendar-slide-right');
    }, 250);
}