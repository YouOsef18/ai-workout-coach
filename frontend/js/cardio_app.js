class CardioTracker {
    constructor() {
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.selectedSubtype = 'easy_run';

        this.modal = document.getElementById('workout-type-modal');
        this.cardioView = document.getElementById('cardio-view');
        this.modalDateEl = document.getElementById('modal-selected-date');
        
        this.btnSelectStrength = document.getElementById('btn-select-strength');
        this.btnSelectCardio = document.getElementById('btn-select-cardio');
        this.btnCloseCardio = document.getElementById('btn-close-cardio');
        this.btnSaveCardio = document.getElementById('btn-save-cardio');

        this.inputDistance = document.getElementById('input-distance');
        this.btnDistMinus = document.getElementById('btn-dist-minus');
        this.btnDistPlus = document.getElementById('btn-dist-plus');
        
        this.inputMin = document.getElementById('input-duration-min');
        this.inputSec = document.getElementById('input-duration-sec');
        this.paceDisplay = document.getElementById('calculated-pace');
        this.presetChips = document.querySelectorAll('#run-presets .chip');

        this.initEvents();
        this.calculatePace();
    }

    haptic(type = 'light') {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            if (['success', 'error', 'warning'].includes(type)) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
            } else {
                window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
            }
        }
    }

    initEvents() {
        this.presetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.haptic('light');
                this.presetChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.selectedSubtype = chip.dataset.subtype;
            });
        });

        this.btnDistMinus.addEventListener('click', () => this.adjustDistance(-0.5));
        this.btnDistPlus.addEventListener('click', () => this.adjustDistance(0.5));

        [this.inputDistance, this.inputMin, this.inputSec].forEach(el => {
            el.addEventListener('input', () => this.calculatePace());
        });

        this.btnSelectStrength.addEventListener('click', () => {
            this.haptic('medium');
            this.closeModal();
            // Возвращаем вызов твоего родного интерфейса из index.html
            if (typeof openDateModal === 'function') {
                openDateModal(this.selectedDate);
            }
        });

        this.btnSelectCardio.addEventListener('click', () => {
            this.haptic('medium');
            this.closeModal();
            this.cardioView.classList.remove('hidden');
        });

        this.btnCloseCardio.addEventListener('click', () => {
            this.haptic('light');
            this.cardioView.classList.add('hidden');
        });

        this.btnSaveCardio.addEventListener('click', () => this.saveCardioWorkout());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    adjustDistance(delta) {
        this.haptic('light');
        let current = Math.max(0.1, (parseFloat(this.inputDistance.value) || 0) + delta);
        this.inputDistance.value = current.toFixed(1);
        this.calculatePace();
    }

    calculatePace() {
        const distance = parseFloat(this.inputDistance.value) || 0;
        const totalSeconds = ((parseInt(this.inputMin.value) || 0) * 60) + (parseInt(this.inputSec.value) || 0);

        if (distance <= 0 || totalSeconds <= 0) {
            this.paceDisplay.textContent = '--:--';
            return;
        }

        const secPerKm = Math.round(totalSeconds / distance);
        const paceMin = Math.floor(secPerKm / 60);
        const paceSec = secPerKm % 60;
        this.paceDisplay.textContent = `${paceMin}:${paceSec < 10 ? '0' + paceSec : paceSec}`;
    }

    openDateSelector(dateStr) {
        this.haptic('light');
        this.selectedDate = dateStr;
        this.modalDateEl.textContent = `Дата: ${dateStr}`;
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    async saveCardioWorkout() {
        const distance = parseFloat(this.inputDistance.value) || 0;
        const totalDurationSec = ((parseInt(this.inputMin.value) || 0) * 60) + (parseInt(this.inputSec.value) || 0);

        try {
            const response = await fetch('/api/workouts/cardio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: this.selectedDate,
                    workout_type: 'cardio',
                    subtype: this.selectedSubtype,
                    distance_km: distance,
                    duration_sec: totalDurationSec,
                    avg_pace: this.paceDisplay.textContent
                })
            });

            if (!response.ok) throw new Error('Failed to save cardio workout');

            this.haptic('success');
            
            // Прячем экран кардио
            this.cardioView.classList.add('hidden');

            // ПРОСТО И НАДЕЖНО: просим главный скрипт загрузить месяц заново.
            // Он сам стянет данные из SQLite и правильно расставит все точки (и красные, и зеленые).
            if (typeof window.loadMonthData === 'function') {
                window.loadMonthData();
            }

        } catch (error) {
            this.haptic('error');
            // Уточнил текст ошибки, так как сервер отбивает 422 ошибку, 
            // если случайно попытаться сохранить дистанцию или время равными нулю
            alert('Ошибка при сохранении пробежки. Проверьте, что дистанция и время больше 0.');
        }
    }

    renderCalendarMarker(dateStr, type) {
        const cell = document.querySelector(`.day-cell[data-date="${dateStr}"]`);
        if (!cell) return;

        let markersContainer = cell.querySelector('.day-markers');
        if (!markersContainer) {
            markersContainer = document.createElement('div');
            markersContainer.className = 'day-markers';
            cell.appendChild(markersContainer);
        }

        const markerClass = type === 'cardio' ? 'marker-cardio' : 'marker-strength';
        if (!markersContainer.querySelector(`.${markerClass}`)) {
            const dot = document.createElement('div');
            dot.className = `marker-dot ${markerClass}`;
            markersContainer.appendChild(dot);
        }
    }
}

const cardioApp = new CardioTracker();

// Замени вызов функции создания тренировки в твоем основном скрипте (app.js)
// на вызов этой функции при клике по дню календаря:
function onCalendarDayClick(dateString) {
    cardioApp.openDateSelector(dateString);
}