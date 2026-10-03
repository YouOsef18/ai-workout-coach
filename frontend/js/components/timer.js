let timerInterval = null; 
let secondsLeft = 0; 
let initialSeconds = 120; 
let isTimerRunning = false;

export function toggleTimer() { 
    if (isTimerRunning) { pauseTimer(); } else { startTimer(); } 
}

export function startTimer() {
    if (!isTimerRunning && timerInterval === null) {
        const m = parseInt(document.getElementById('timer-min').value) || 0;
        const s = parseInt(document.getElementById('timer-sec').value) || 0;
        secondsLeft = m * 60 + s;
        if (secondsLeft <= 0) return;
        initialSeconds = secondsLeft;
    }
    isTimerRunning = true;
    document.getElementById('timer-main-btn').innerText = "=";
    document.getElementById('timer-stop-btn').classList.remove('hidden');
    timerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) { finishTimer(); } else { updateTimerUI(secondsLeft); }
    }, 1000);
}

export function pauseTimer() { 
    isTimerRunning = false; 
    clearInterval(timerInterval); 
    timerInterval = null; 
    document.getElementById('timer-main-btn').innerText = "▶"; 
}

export function resetTimer() { 
    pauseTimer(); 
    document.getElementById('timer-stop-btn').classList.add('hidden'); 
    updateTimerUI(initialSeconds); 
    document.getElementById('timer-display-group').classList.remove('hidden'); 
    document.getElementById('timer-msg').classList.add('hidden'); 
}

export function finishTimer() { 
    pauseTimer(); 
    document.getElementById('timer-display-group').classList.add('hidden'); 
    document.getElementById('timer-msg').classList.remove('hidden'); 
    setTimeout(() => { resetTimer(); }, 3000); 
}

export function updateTimerUI(s) { 
    const m = Math.floor(s / 60); 
    const sec = s % 60; 
    document.getElementById('timer-min').value = String(m).padStart(2, '0'); 
    document.getElementById('timer-sec').value = String(sec).padStart(2, '0'); 
}