import { haptic } from '../utils/telegram.js';

export const BarbellLoader = {
    steps: [
        { time: 0, weight: 20, text: "Разминаем суставы...", plates: [] },
        { time: 1200, weight: 40, text: "Считаем тоннаж и прошлый объем...", plates: [10] },
        { time: 2400, weight: 80, text: "Анализируем восстановление мышц...", plates: [10, 20] },
        { time: 3600, weight: 120, text: "Подбираем оптимальные углы и RPE...", plates: [10, 20, 20] },
        { time: 4800, weight: 140, text: "Финальная сборка сплита...", plates: [10, 20, 20, 10] }
    ],
    timers: [],
    start() {
        document.getElementById('barbell-loader').classList.remove('hidden');
        document.getElementById('barbell-loader').style.opacity = '1';
        this.resetUI();
        this.steps.forEach((step, idx) => {
            const t = setTimeout(() => {
                this.updateStep(step);
                const progress = ((idx + 1) / this.steps.length) * 90;
                document.getElementById('progress-fill').style.width = `${progress}%`;
                if (idx > 0) haptic('medium');
            }, step.time);
            this.timers.push(t);
        });
    },
    updateStep(step) {
        document.getElementById('loader-weight-num').innerText = step.weight;
        document.getElementById('loader-status-text').innerText = step.text;
        const leftSleeve = document.getElementById('plates-left');
        const rightSleeve = document.getElementById('plates-right');
        leftSleeve.innerHTML = ''; rightSleeve.innerHTML = '';
        step.plates.forEach(p => {
            const lp = document.createElement('div'); lp.className = `plate plate-${p}`;
            const rp = document.createElement('div'); rp.className = `plate plate-${p}`;
            leftSleeve.appendChild(lp); rightSleeve.appendChild(rp);
        });
    },
    stop(success) {
        this.timers.forEach(t => clearTimeout(t));
        this.timers = [];
        if (success) {
            haptic('success');
            document.getElementById('loader-status-text').innerText = "Штанга заряжена! Погнали 🔥";
            document.getElementById('progress-fill').style.width = '100%';
            setTimeout(() => {
                document.getElementById('barbell-loader').style.opacity = '0';
                setTimeout(() => { document.getElementById('barbell-loader').classList.add('hidden'); }, 400);
            }, 600);
        } else {
            haptic('error');
            document.getElementById('barbell-loader').classList.add('hidden');
        }
    },
    resetUI() {
        document.getElementById('loader-weight-num').innerText = '20';
        document.getElementById('loader-status-text').innerText = 'Разминаем суставы...';
        document.getElementById('progress-fill').style.width = '0%';
        document.getElementById('plates-left').innerHTML = '';
        document.getElementById('plates-right').innerHTML = '';
    }
};