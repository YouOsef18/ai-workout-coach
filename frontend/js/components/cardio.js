import { state } from '../state.js';
import { saveCardioApi } from '../api.js';
import { haptic } from '../utils/telegram.js';

export class CardioTracker {
    constructor() {
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

    initEvents() {
        this.presetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                haptic('light');
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
            haptic('medium');
            this.closeModal();
            if (typeof window.openDateModal === 'function') {
                window.openDateModal(state.selectedDateStr);
            }
        });

        this.btnSelectCardio.addEventListener('click', () => {
            haptic('medium');
            this.closeModal();
            this.cardioView.classList.remove('hidden');
        });

        this.btnCloseCardio.addEventListener('click', () => {
            haptic('light');
            this.cardioView.classList.add('hidden');
        });

        this.btnSaveCardio.addEventListener('click', () => this.saveCardioWorkout());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    adjustDistance(delta) {
        haptic('light');
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
        haptic('light');
        state.selectedDateStr = dateStr;
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
            await saveCardioApi({
                date: state.selectedDateStr,
                workout_type: 'cardio',
                subtype: this.selectedSubtype,
                distance_km: distance,
                duration_sec: totalDurationSec,
                avg_pace: this.paceDisplay.textContent
            });

            haptic('success');
            this.cardioView.classList.add('hidden');

            if (typeof window.loadMonthData === 'function') {
                window.loadMonthData();
            }
        } catch (error) {
            haptic('error');
            alert('Ошибка при сохранении пробежки. Проверьте, что дистанция и время больше 0.');
        }
    }
}