const raceTimeSelect = document.getElementById('raceTime');
const startRaceBtn = document.getElementById('startRace');
const timerDisplay = document.getElementById('timer');
const yellowFlagBtn = document.getElementById('yellowFlag');
const redFlagBtn = document.getElementById('redFlag');
const restartBtn = document.getElementById('restart');
let totalSeconds = 0;
let secondsLeft = 0;
let timerInterval = null;
let isRunning = false;
let isYellowFlag = false;
let isRedFlag = false;
let lastMinutePlayed = -1;
let hasPlayed30Seconds = false; // Track if 30-second sound has been played
// Initialize NoSleep to keep screen awake on mobile devices
const noSleep = new NoSleep();
// Explicitly enable start button and time selector on page load
startRaceBtn.disabled = false;
raceTimeSelect.disabled = false; // Ensure time selector is enabled on load
console.log("Script loaded, start button and time selector enabled!");
// Function to generate a random delay between 2000ms (2s) and 4000ms (4s)
function getRandomDelay() {
    return Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000;
}
// Check if the current page is nosteward.html
const isNoStewardPage = window.location.pathname.includes('nosteward.html');
// Function to update background color or pattern based on state
function updateBackgroundColor() {
    // Remove checkerboard class by default to ensure it's only applied when race ends
    document.body.classList.remove('checkerboard');
    // Set background based on state
    if (!isRunning && secondsLeft <= 0) {
        // Race has ended, apply checkerboard pattern
        document.body.classList.add('checkerboard');
    } else if (isRedFlag) {
        document.body.style.backgroundColor = '#e74c3c'; // Red for Red Flag
    } else if (isYellowFlag) {
        document.body.style.backgroundColor = '#f1c40f'; // Yellow for Yellow Flag
    } else if (isRunning) {
        document.body.style.backgroundColor = '#2ecc71'; // Green for Race Running
    } else {
        document.body.style.backgroundColor = '#f0f0f0'; // Default gray when not running
    }
}
// Start race with updated sequence
startRaceBtn.addEventListener('click', () => {
    totalSeconds = parseInt(raceTimeSelect.value) * 60;
    secondsLeft = totalSeconds;
    updateTimerDisplay();
    raceTimeSelect.disabled = true; // Disable time selector when race starts
    startRaceBtn.disabled = true;
    yellowFlagBtn.disabled = false;
    redFlagBtn.disabled = false;
    restartBtn.disabled = false;
    // Enable NoSleep to keep screen awake during the race
    try {
        noSleep.enable();
        console.log("Screen wake lock enabled");
    } catch (e) {
        console.error("Failed to enable screen wake lock:", e);
    }
    // Step 0: Play start-engines.mp3 immediately on button click
    try {
        console.log("Playing start-engines sound immediately");
        document.getElementById('startEnginesSound').play().catch(e => console.error("Audio play error for start-engines:", e));
    } catch (e) {
        console.error("Start-engines sound failed:", e);
    }
    // Step 1: Wait 3 seconds before starting the beep sequence
    setTimeout(() => {
        // Step 2: Play beep.mp3 every 1.5 seconds for 4 times
        let beepCount = 0;
        const beepInterval = setInterval(() => {
            if (beepCount < 4) {
                try {
                    console.log(`Playing beep ${beepCount + 1}/4`);
                    document.getElementById('beepSound').play().catch(e => console.error("Audio play error for beep:", e));
                } catch (e) {
                    console.error("Beep sound failed:", e);
                }
                beepCount++;
            } else {
                clearInterval(beepInterval); // Stop after 4 beeps
                // Step 3: Wait random 2-3 seconds after last beep
                const randomFinalDelay = Math.floor(Math.random() * 2000) + 1000; // Random delay between 2000-3000ms (2-3 seconds)
                setTimeout(() => {
                    // Step 4: Play start-beep.mp3 and start the timer
                    try {
                        console.log("Playing start-beep and starting timer");
                        document.getElementById('startBeepSound').play().catch(e => console.error("Audio play error for start-beep:", e));
                    } catch (e) {
                        console.error("Start-beep sound failed:", e);
                    }
                    isRunning = true;
                    updateBackgroundColor(); // Update background when race starts
                    startTimer();
                }, randomFinalDelay);
            }
        }, 1500); // Beep every 1.5 seconds
    }, 3000); // Initial 3-second delay
});
// Timer logic
function startTimer() {
    timerInterval = setInterval(() => {
        if (isRunning && secondsLeft > 0) {
            secondsLeft--;
            updateTimerDisplay();
            checkTimeMarks(); // Check for minute and 30-second marks
        } else if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            try {
                document.getElementById('endSound').play().catch(e => console.error("Audio play error:", e));
            } catch (e) {
                console.error("End sound failed:", e);
            }
            updateBackgroundColor(); // Update background when race ends (apply checkerboard)
            disableButtons();
            // Disable NoSleep when race ends
            try {
                noSleep.disable();
                console.log("Screen wake lock disabled");
            } catch (e) {
                console.error("Failed to disable screen wake lock:", e);
            }
        }
    }, 1000);
}
function updateTimerDisplay() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
function checkTimeMarks() {
    const currentMinute = Math.floor(secondsLeft / 60);
    const currentSecond = secondsLeft % 60;
    // Check for minute marks (play specific minute audio when seconds hit 0)
    if (currentMinute !== lastMinutePlayed && currentSecond === 0 && currentMinute > 0) {
        try {
            const audioId = `${currentMinute}-minute`;
            console.log(`Playing audio for ${currentMinute} minute(s) left: ${audioId}`);
            const audioElement = document.getElementById(audioId);
            if (audioElement) {
                audioElement.play().catch(e => console.error(`Audio play error for ${audioId}:`, e));
            } else {
                console.error(`Audio element not found for ${audioId}`);
            }
        } catch (e) {
            console.error(`Error playing ${currentMinute}-minute sound:`, e);
        }
        lastMinutePlayed = currentMinute;
    }
    // Check for 30-second mark
    if (secondsLeft === 30 && !hasPlayed30Seconds) {
        try {
            console.log("Playing audio for 30 seconds left");
            document.getElementById('30-seconds').play().catch(e => console.error("Audio play error for 30-seconds:", e));
            hasPlayed30Seconds = true; // Mark as played to avoid repeats
        } catch (e) {
            console.error("30-seconds sound failed:", e);
        }
    }
}
function disableButtons() {
    yellowFlagBtn.disabled = true;
    redFlagBtn.disabled = true;
    restartBtn.disabled = false;
}
// Yellow Flag logic with conditional delay for clearing, get-ready sound, and button disable
yellowFlagBtn.addEventListener('click', () => {
    isYellowFlag = !isYellowFlag;
    if (isYellowFlag) {
        try {
            document.getElementById('yellowOnSound').play().catch(e => console.error("Audio play error:", e));
        } catch (e) {
            console.error("Yellow on sound failed:", e);
        }
        yellowFlagBtn.textContent = 'Clear Yellow Flag';
        updateBackgroundColor(); // Update background immediately when Yellow Flag is set
    } else {
        const updateYellowFlagOff = () => {
            try {
                document.getElementById('yellowOffSound').play().catch(e => console.error("Audio play error:", e));
            } catch (e) {
                console.error("Yellow off sound failed:", e);
            }
            yellowFlagBtn.textContent = 'Yellow Flag';
            updateBackgroundColor(); // Update background when Yellow Flag is cleared
            console.log("Yellow Flag cleared after delay (if applied)");
            // Re-enable buttons after delay completes (only on nosteward.html)
            if (isNoStewardPage) {
                yellowFlagBtn.disabled = false;
                redFlagBtn.disabled = false;
                console.log("Buttons re-enabled after delay for Yellow Flag clear");
            }
        };
        if (isNoStewardPage) {
            try {
                console.log("Playing get-ready sound before delay for Yellow Flag clear");
                document.getElementById('getReadySound').play().catch(e => console.error("Audio play error for get-ready:", e));
            } catch (e) {
                console.error("Get-ready sound failed for Yellow Flag clear:", e);
            }
            // Disable both buttons during the delay to prevent re-clicking
            yellowFlagBtn.disabled = true;
            redFlagBtn.disabled = true;
            console.log("Buttons disabled during delay for Yellow Flag clear");
            const delay = getRandomDelay();
            console.log(`Applying random delay of ${delay}ms for Yellow Flag clear on nosteward.html`);
            setTimeout(updateYellowFlagOff, delay);
        } else {
            console.log("No delay applied for Yellow Flag clear (not on nosteward.html)");
            updateYellowFlagOff();
        }
    }
    if (isYellowFlag) {
        updateBackgroundColor(); // Already updated if flag is set, but ensure consistency
    }
});

// Red Flag logic with conditional delay for clearing, get-ready sound, and button disable
redFlagBtn.addEventListener('click', () => {
    isRedFlag = !isRedFlag;
    if (isRedFlag) {
        try {
            document.getElementById('redOnSound').play().catch(e => console.error("Audio play error:", e));
        } catch (e) {
            console.error("Red on sound failed:", e);
        }
        isRunning = false;
        clearInterval(timerInterval);
        redFlagBtn.textContent = 'Clear Red Flag';
        updateBackgroundColor(); // Update background immediately when Red Flag is set
    } else {
        const updateRedFlagOff = () => {
            try {
                document.getElementById('redOffSound').play().catch(e => console.error("Audio play error:", e));
            } catch (e) {
                console.error("Red off sound failed:", e);
            }
            isRunning = true;
            startTimer();
            redFlagBtn.textContent = 'Red Flag';
            updateBackgroundColor(); // Update background when Red Flag is cleared
            console.log("Red Flag cleared after delay (if applied)");
            // Re-enable buttons after delay completes (only on nosteward.html)
            if (isNoStewardPage) {
                yellowFlagBtn.disabled = false;
                redFlagBtn.disabled = false;
                console.log("Buttons re-enabled after delay for Red Flag clear");
            }
        };
        if (isNoStewardPage) {
            try {
                console.log("Playing get-ready sound before delay for Red Flag clear");
                document.getElementById('getReadySound').play().catch(e => console.error("Audio play error for get-ready:", e));
            } catch (e) {
                console.error("Get-ready sound failed for Red Flag clear:", e);
            }
            // Disable both buttons during the delay to prevent re-clicking
            yellowFlagBtn.disabled = true;
            redFlagBtn.disabled = true;
            console.log("Buttons disabled during delay for Red Flag clear");
            const delay = getRandomDelay();
            console.log(`Applying random delay of ${delay}ms for Red Flag clear on nosteward.html`);
            setTimeout(updateRedFlagOff, delay);
        } else {
            console.log("No delay applied for Red Flag clear (not on nosteward.html)");
            updateRedFlagOff();
        }
    }
    if (isRedFlag) {
        updateBackgroundColor(); // Already updated if flag is set, but ensure consistency
    }
});
// Restart logic
restartBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    secondsLeft = totalSeconds;
    updateTimerDisplay();
    isYellowFlag = false;
    isRedFlag = false;
    yellowFlagBtn.textContent = 'Yellow Flag';
    redFlagBtn.textContent = 'Red Flag';
    raceTimeSelect.disabled = false; // Enable time selector on restart
    startRaceBtn.disabled = false;
    yellowFlagBtn.disabled = true;
    redFlagBtn.disabled = true;
    restartBtn.disabled = true;
    lastMinutePlayed = -1;
    hasPlayed30Seconds = false; // Reset 30-second sound flag on restart
    try {
        document.getElementById('restartSound').play().catch(e => console.error("Audio play error:", e));
    } catch (e) {
        console.error("Restart sound failed:", e);
    }
    updateBackgroundColor(); // Update background when race is restarted (remove checkerboard)
    // Disable NoSleep when race is restarted
    try {
        noSleep.disable();
        console.log("Screen wake lock disabled on restart");
    } catch (e) {
        console.error("Failed to disable screen wake lock on restart:", e);
    }
});