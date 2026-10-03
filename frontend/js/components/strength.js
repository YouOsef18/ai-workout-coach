import { state } from '../state.js';
import { saveCurrentDraft, clearDraft, getDraft } from '../services/storage.js';
import { fetchWorkoutByDateApi, deleteWorkoutApi, analyzeWorkoutApi } from '../api.js';
import { loadMonthData } from './calendar.js';
import { BarbellLoader } from './loader.js';
import { haptic } from '../utils/telegram.js';

const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

export function resetModalContent() { 
    document.getElementById('view-mode').classList.add('hidden'); 
    document.getElementById('edit-mode').classList.add('hidden'); 
    document.getElementById('loading-state').classList.add('hidden'); 
}

export async function openDateModal(dateStr) {
    state.selectedDateStr = dateStr; 
    document.getElementById('modal-date-title').innerText = dateStr;
    resetModalContent(); 
    document.getElementById('loading-state').classList.remove('hidden'); 
    document.getElementById('workout-modal').classList.remove('hidden');
    
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) tg.BackButton.show();

    const draft = getDraft();
    if (draft && draft.date === dateStr) { 
        document.getElementById('loading-state').classList.add('hidden'); 
        openDraftWorkout(); 
        return; 
    }
    
    try {
        const data = await fetchWorkoutByDateApi(dateStr);
        document.getElementById('loading-state').classList.add('hidden');
        if (data.found && data.workout) { 
            state.currentLoadedWorkout = data.workout; 
            showViewMode(data.workout); 
        } else { 
            state.currentLoadedWorkout = null; 
            showNewEditMode(); 
        }
    } catch (e) {
        document.getElementById('loading-state').classList.add('hidden'); 
        state.currentLoadedWorkout = null; 
        showNewEditMode();
    }
}

export function closeModal() {
    const isEditingNow = !document.getElementById('edit-mode').classList.contains('hidden');
    if (isEditingNow) saveCurrentDraft();
    document.getElementById('workout-modal').classList.add('hidden');
    resetModalContent(); 
    state.currentLoadedWorkout = null;
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) tg.BackButton.hide();
}

export function showViewMode(workout) {
    resetModalContent(); 
    document.getElementById('view-mode').classList.remove('hidden');
    document.getElementById('view-workout-name').innerText = workout.workout_name;
    document.getElementById('view-exercises-list').innerHTML = workout.exercises.map(ex => `<div style="background: var(--card-bg); padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border);"><div style="font-weight: 700; color: #f8fafc; font-size: 13px;">${ex.name}</div><div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">${ex.sets.map((s, i) => `<div>Сет ${i+1}: <strong style="color:#fff;">${s.weight} кг × ${s.reps}</strong> (RPE <span style="color:var(--accent); font-weight:800;">${s.rpe}</span>)</div>`).join('')}</div></div>`).join('');
    document.getElementById('view-athlete-notes-box').innerText = workout.athlete_notes ? `Заметки: "${workout.athlete_notes}"` : "";
    document.getElementById('view-coach-notes').innerText = workout.coach_notes || "Разбор отсутствует.";
    const planBox = document.getElementById('view-next-plan');
    if (workout.next_workout && workout.next_workout.length > 0) {
        planBox.innerHTML = workout.next_workout.map(item => `<div class="plan-card"><div><div style="font-weight: 700; color: #fff;">${item.exercise}</div><div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Фокус: ${item.cue}</div></div><div style="color: var(--accent); font-weight: 800; font-size: 12px; white-space: nowrap;">${item.weight_kg} кг × ${item.sets}с</div></div>`).join('');
    } else { 
        planBox.innerHTML = `<div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">План не сохранен.</div>`; 
    }
}

export function showNewEditMode() {
    state.isEditingExisting = false; 
    resetModalContent(); 
    document.getElementById('edit-mode').classList.remove('hidden');
    document.getElementById('workout-name').value = "Push День (Грудь / Плечи)"; 
    document.getElementById('athlete-notes').value = ""; 
    document.getElementById('submit-btn').innerText = "Завершить и получить план";
    state.exercises = [{ name: "Жим штанги лежа", sets: [{ weight: 80, reps: 8, rpe: 8 }, { weight: 80, reps: 8, rpe: 8.5 }] }];
    renderExercises(); 
    saveCurrentDraft();
}

export function startEditingCurrentWorkout() {
    if (!state.currentLoadedWorkout) return;
    state.isEditingExisting = true; 
    resetModalContent(); 
    document.getElementById('edit-mode').classList.remove('hidden');
    document.getElementById('workout-name').value = state.currentLoadedWorkout.workout_name || ""; 
    document.getElementById('athlete-notes').value = state.currentLoadedWorkout.athlete_notes || ""; 
    document.getElementById('submit-btn').innerText = "Обновить план";
    state.exercises = JSON.parse(JSON.stringify(state.currentLoadedWorkout.exercises || []));
    if (state.exercises.length === 0) state.exercises = [{ name: "Упражнение", sets: [{ weight: 20, reps: 10, rpe: 8 }] }];
    renderExercises(); 
    saveCurrentDraft();
}

export function openDraftWorkout() {
    const draft = getDraft(); 
    if (!draft || !draft.date) return;
    state.selectedDateStr = draft.date; 
    state.isEditingExisting = !!draft.isEditingExisting;
    const parts = draft.date.split('-');
    if (parts.length === 3) {
        const dYear = parseInt(parts[0], 10); 
        const dMonth = parseInt(parts[1], 10) - 1;
        if (state.currentDate.getFullYear() !== dYear || state.currentDate.getMonth() !== dMonth) { 
            state.currentDate = new Date(dYear, dMonth, 1); 
            loadMonthData(); 
        }
    }
    document.getElementById('modal-date-title').innerText = state.selectedDateStr;
    resetModalContent(); 
    document.getElementById('edit-mode').classList.remove('hidden'); 
    document.getElementById('workout-modal').classList.remove('hidden');
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) tg.BackButton.show();
    document.getElementById('workout-name').value = draft.workout_name || ""; 
    document.getElementById('athlete-notes').value = draft.athlete_notes || "";
    document.getElementById('submit-btn').innerText = state.isEditingExisting ? "Обновить план" : "Завершить и получить план";
    state.exercises = draft.exercises || []; 
    if (state.exercises.length === 0) { 
        state.exercises = [{ name: "Новое упражнение", sets: [{ weight: 20, reps: 10, rpe: 8 }] }]; 
    }
    renderExercises();
}

export function askDeleteWorkout() { 
    document.getElementById('confirm-modal').classList.remove('hidden'); 
}

export function closeConfirmModal() { 
    document.getElementById('confirm-modal').classList.add('hidden'); 
}

export async function confirmDeleteWorkout() {
    closeConfirmModal();
    try {
        const data = await deleteWorkoutApi(state.selectedDateStr);
        if (data.status === "success") { 
            state.currentLoadedWorkout = null; 
            clearDraft(); 
            closeModal(); 
            await loadMonthData(); 
            haptic('success');
        }
    } catch (err) { 
        alert("Ошибка удаления: " + err.message); 
    }
}

export function renderExercises() {
    const container = document.getElementById('exercises-container');
    container.innerHTML = state.exercises.map((ex, exIdx) => `<div class="exercise-block"><div class="exercise-header"><input type="text" value="${ex.name}" oninput="window.updateExName(${exIdx}, this.value)" class="exercise-title-input"><button onclick="window.removeExercise(${exIdx})" class="remove-ex-btn">✕</button></div><div style="display: flex; flex-direction: column; gap: 8px;">${ex.sets.map((s, sIdx) => `<div class="set-grid"><div><label>Вес (кг)</label><input type="number" step="0.5" value="${s.weight}" oninput="window.updateSet(${exIdx},${sIdx}, 'weight', this.value)"></div><div><label>Повторы</label><input type="number" value="${s.reps}" oninput="window.updateSet(${exIdx},${sIdx}, 'reps', this.value)"></div><div><label>RPE (1-10)</label><input type="number" step="0.5" min="1" max="10" value="${s.rpe}" oninput="window.updateSet(${exIdx},${sIdx}, 'rpe', this.value)" class="rpe-input"></div></div>`).join('')}</div><button onclick="window.addSet(${exIdx})" class="add-btn-sub">+ подход</button></div>`).join('');
}

export function addExercise() { 
    state.exercises.push({ name: "Новое упражнение", sets: [{ weight: 20, reps: 10, rpe: 8 }] }); 
    renderExercises(); 
    saveCurrentDraft(); 
}

export function removeExercise(idx) { 
    state.exercises.splice(idx, 1); 
    renderExercises(); 
    saveCurrentDraft(); 
}

export function addSet(exIdx) { 
    const lastSet = state.exercises[exIdx].sets[state.exercises[exIdx].sets.length - 1] || { weight: 20, reps: 10, rpe: 8 }; 
    state.exercises[exIdx].sets.push({ ...lastSet }); 
    renderExercises(); 
    saveCurrentDraft(); 
}

export async function submitWorkout() {
    const btn = document.getElementById('submit-btn'); 
    const prevText = btn.innerText; 
    btn.disabled = true;
    BarbellLoader.start();
    const payload = { 
        user_id: state.currentUserId, 
        workout_date: state.selectedDateStr, 
        workout_name: document.getElementById('workout-name').value, 
        exercises: state.exercises, 
        athlete_notes: document.getElementById('athlete-notes').value || "Все прошло штатно." 
    };
    try {
        const resData = await analyzeWorkoutApi(payload);
        if (resData.status === "success") {
            BarbellLoader.stop(true); 
            clearDraft();
            setTimeout(async () => { 
                await loadMonthData(); 
                openDateModal(state.selectedDateStr); 
            }, 800);
        }
    } catch (err) {
        BarbellLoader.stop(false); 
        alert("Ошибка отправки: " + err.message);
    } finally {
        btn.innerText = prevText; 
        btn.disabled = false;
    }
}