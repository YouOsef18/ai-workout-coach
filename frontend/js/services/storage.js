import { state } from '../state.js';

function getDraftKey() {
    return `workout_draft_${state.currentUserId}`;
}

export function saveCurrentDraft() {
    if (!state.selectedDateStr) return;
    const draftObj = {
        date: state.selectedDateStr,
        isEditingExisting: state.isEditingExisting,
        workout_name: document.getElementById('workout-name')?.value || "",
        athlete_notes: document.getElementById('athlete-notes')?.value || "",
        exercises: state.exercises
    };
    try {
        localStorage.setItem(getDraftKey(), JSON.stringify(draftObj));
    } catch (e) {}
    updateDraftButtonVisibility();
}

export function getDraft() {
    try {
        const raw = localStorage.getItem(getDraftKey());
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function clearDraft() {
    try {
        localStorage.removeItem(getDraftKey());
    } catch (e) {}
    updateDraftButtonVisibility();
}

export function updateDraftButtonVisibility() {
    const btn = document.getElementById('draft-alert-btn');
    if (!btn) return;
    const draft = getDraft();
    if (draft && draft.date) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}