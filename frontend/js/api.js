import { state } from './state.js';

export async function fetchMonthStatusApi(yearMonth) {
    const res = await fetch(`/api/workouts/calendar/month-status?year_month=${yearMonth}&_t=${Date.now()}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!res.ok) throw new Error('Ошибка загрузки дат');
    return await res.json();
}

export async function fetchWorkoutByDateApi(dateStr) {
    const res = await fetch(`/api/workout/by-date?user_id=${state.currentUserId}&workout_date=${dateStr}&_t=${Date.now()}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return await res.json();
}

export async function deleteWorkoutApi(dateStr) {
    const res = await fetch(`/api/workout?user_id=${state.currentUserId}&workout_date=${dateStr}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return await res.json();
}

export async function analyzeWorkoutApi(payload) {
    const res = await fetch('/api/workout/analyze', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
    return data;
}

export async function saveCardioApi(cardioPayload) {
    const response = await fetch('/api/workouts/cardio', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(cardioPayload)
    });
    if (!response.ok) throw new Error('Failed to save cardio workout');
    return await response.json();
}