const tg = window.Telegram?.WebApp;

export const state = {
    currentUserId: tg?.initDataUnsafe?.user?.id || 12345,
    currentDate: new Date(),
    selectedDateStr: "",
    calendarMarkers: {},
    currentLoadedWorkout: null,
    isEditingExisting: false,
    exercises: []
};