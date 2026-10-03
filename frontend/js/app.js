import { initTelegram } from './utils/telegram.js';
import { loadMonthData, changeMonth } from './components/calendar.js';
import { 
    openDateModal, 
    closeModal, 
    startEditingCurrentWorkout, 
    askDeleteWorkout, 
    closeConfirmModal, 
    confirmDeleteWorkout, 
    addExercise, 
    removeExercise, 
    addSet, 
    submitWorkout,
    renderExercises
} from './components/strength.js';
import { CardioTracker } from './components/cardio.js';
import { openDraftWorkout } from './components/strength.js';
import { toggleTimer, startTimer, pauseTimer, resetTimer } from './components/timer.js';
import { state } from './state.js';

// Пробрасываем функции в глобальный объем окна для вызовов прямо из HTML (onclick)
window.changeMonth = changeMonth;
window.openDateModal = openDateModal;
window.closeModal = closeModal;
window.startEditingCurrentWorkout = startEditingCurrentWorkout;
window.askDeleteWorkout = askDeleteWorkout;
window.closeConfirmModal = closeConfirmModal;
window.confirmDeleteWorkout = confirmDeleteWorkout;
window.addExercise = addExercise;
window.removeExercise = removeExercise;
window.addSet = addSet;
window.submitWorkout = submitWorkout;
window.openDraftWorkout = openDraftWorkout;
window.loadMonthData = loadMonthData;

// Таймер
window.toggleTimer = toggleTimer;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;

// Вспомогательные инлайновые мутаторы для динамических полей упражнений
window.updateExName = (exIdx, value) => {
    state.exercises[exIdx].name = value;
    // динамический импорт или вызов сохранения черновика
};
window.updateSet = (exIdx, sIdx, field, value) => {
    if (field === 'weight' || field === 'rpe') {
        state.exercises[exIdx].sets[sIdx][field] = parseFloat(value) || 0;
    } else {
        state.exercises[exIdx].sets[sIdx][field] = parseInt(value) || 0;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем Telegram с обработчиком кнопки "Назад"
    initTelegram(() => closeModal());

    // Инициализируем кардио-трекер и сохраняем инстанс глобально
    window.cardioAppInstance = new CardioTracker();

    // Первичная загрузка данных календаря
    loadMonthData();
});