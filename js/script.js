// ===== DOM ELEMENTS =====
const raceTimeSelect = document.getElementById('raceTime');
const startRaceBtn = document.getElementById('startRace');
const timerDisplay = document.getElementById('timer');
const yellowFlagBtn = document.getElementById('yellowFlag');
const redFlagBtn = document.getElementById('redFlag');
const restartBtn = document.getElementById('restart');
const voiceSelect = document.getElementById('voiceSelect');
const practiceModeCheckbox = document.getElementById('practiceMode');

// ===== STATE =====
let totalSeconds = 0;
let secondsLeft = 0;
let timerInterval = null;
let isRunning = false;
let isYellowFlag = false;
let isRedFlag = false;
let lastMinutePlayed = -1;
let hasPlayed30Seconds = false;
let yellowFlagCount = 0;
let redFlagCount = 0;
let isPracticeMode = false;
let raceActive = false;      // true from Start Race until the race ends or is restarted
let raceSessionId = 0;       // bumped on end/restart so pending race steps cancel themselves

const isNoStewardPage = window.location.pathname.includes('nosteward.html');
const noSleep = new NoSleep();

startRaceBtn.disabled = false;
raceTimeSelect.disabled = false;

// ===== WEB AUDIO SYSTEM =====
// Uses Web Audio API exclusively — more reliable than HTML5 Audio on iOS Safari.
// Buffers are decoded at page load (no user gesture needed for decoding).
// The AudioContext is resumed synchronously on the first button press, which
// satisfies iOS's requirement that audio be initiated by a user gesture.

const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
const audioContext = AudioContextCtor ? new AudioContextCtor() : null;
const audioBuffers = {};

// Maps audio IDs to base filenames (without voice prefix/extension)
const AUDIO_NAMES = {
    startEnginesSound: 'startengines',
    yellowOnSound:     'yellowon',
    yellowOffSound:    'yellowoff',
    redOnSound:        'redon',
    redOffSound:       'redoff',
    endSound:          'end',
    restartSound:      'restart',
    getReadySound:     'getready',
    '30-seconds':      '30-seconds',
    '1-minute': '1-minute', '2-minute': '2-minute', '3-minute': '3-minute',
    '4-minute': '4-minute', '5-minute': '5-minute', '6-minute': '6-minute',
    '7-minute': '7-minute', '8-minute': '8-minute', '9-minute': '9-minute',
};

// Shared sounds that are the same across all voices
const SHARED_AUDIO = {
    beepSound:      'audio/beep.mp3',
    startBeepSound: 'audio/start-beep.mp3',
};

const VOICE_CONFIG = {
    america: { dir: 'audio/america', prefix: '',     ext: '.mp3' },
    europe:  { dir: 'audio/europe',  prefix: 'e-',   ext: '.mp3' },
    merica:  { dir: 'audio/merica',  prefix: 'n-',   ext: '.mp3' },
    dee:     { dir: 'audio/dee',     prefix: 'dee-', ext: '.wav' },
    djt:     { dir: 'audio/djt',     prefix: 'djt-', ext: '.wav' },
};

function getAudioUrl(audioId, voice) {
    if (SHARED_AUDIO[audioId]) return SHARED_AUDIO[audioId];
    const base = AUDIO_NAMES[audioId];
    if (!base) return null;
    const { dir, prefix, ext } = VOICE_CONFIG[voice] || VOICE_CONFIG.america;
    return `${dir}/${prefix}${base}${ext}`;
}

function bufferKey(audioId, voice) {
    return SHARED_AUDIO[audioId] ? audioId : `${voice}:${audioId}`;
}

async function loadBuffer(audioId, voice) {
    if (!audioContext) return null;
    const key = bufferKey(audioId, voice);
    if (audioBuffers[key]) return audioBuffers[key];
    const url = getAudioUrl(audioId, voice);
    if (!url) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const decoded = await audioContext.decodeAudioData(await response.arrayBuffer());
        audioBuffers[key] = decoded;
        return decoded;
    } catch (e) {
        console.warn(`Audio load failed [${audioId}]:`, e);
        return null;
    }
}

function preloadVoice(voice) {
    if (!audioContext) return;
    [...Object.keys(AUDIO_NAMES), ...Object.keys(SHARED_AUDIO)].forEach(id => loadBuffer(id, voice));
}

// Audio playback rules (voice clips vary a lot in length between announcers):
// - Announcer clips share one channel, so two voice clips never overlap.
//   announce() interrupts whatever is playing; announceWhenFree() waits its turn.
// - Beeps go through playSound() and are only used while the announcer is quiet.
// - stopAllSounds() silences everything and drops anything still loading or queued.

const activeSources = new Set();
let audioGeneration = 0;     // bumped by stopAllSounds() so late-loading clips never play
let announcerToken = 0;      // identifies the clip that currently owns the announcer channel
let announcerSource = null;
let announcerActive = false;
const announcerQueue = [];
const MAX_CALLOUT_DELAY_MS = 5000;

function getBuffer(audioId) {
    const voice = voiceSelect ? voiceSelect.value : 'america';
    const key = bufferKey(audioId, voice);
    const ready = audioContext.state === 'running' ? Promise.resolve() : audioContext.resume();
    return ready.then(() => audioBuffers[key] || loadBuffer(audioId, voice));
}

function playBuffer(buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    activeSources.add(source);
    const ended = new Promise(resolve => {
        source.onended = () => { activeSources.delete(source); resolve(); };
    });
    return { source, ended };
}

function stopAllSounds() {
    audioGeneration++;
    announcerToken++;
    announcerSource = null;
    announcerActive = false;
    announcerQueue.length = 0;
    activeSources.forEach(source => { try { source.stop(); } catch (e) {} });
    activeSources.clear();
}

// Plays a non-voice sound (beeps). Resolves when it finishes.
function playSound(audioId) {
    if (!audioContext) return Promise.resolve();
    const gen = audioGeneration;
    return getBuffer(audioId).then(buffer => {
        if (!buffer || gen !== audioGeneration) return;
        return playBuffer(buffer).ended;
    });
}

// Plays an announcer clip, cutting off any clip already playing.
// Resolves when the clip finishes or is interrupted.
function announce(audioId) {
    const token = ++announcerToken;
    if (announcerSource) { try { announcerSource.stop(); } catch (e) {} }
    announcerSource = null;
    announcerActive = true;
    if (!audioContext) return Promise.resolve();
    const gen = audioGeneration;

    const finish = () => {
        if (token !== announcerToken) return;
        announcerSource = null;
        announcerActive = false;
        // Skip callouts that waited too long to still be accurate
        while (announcerQueue.length) {
            const next = announcerQueue.shift();
            if (performance.now() - next.queuedAt <= MAX_CALLOUT_DELAY_MS) { announce(next.audioId); break; }
        }
    };

    return getBuffer(audioId).then(buffer => {
        if (token !== announcerToken || gen !== audioGeneration) return;
        if (!buffer) return finish();
        const { source, ended } = playBuffer(buffer);
        announcerSource = source;
        return ended.then(finish);
    });
}

// Plays an announcer clip once the channel is free (used for time callouts).
// Dropped if the channel stays busy longer than MAX_CALLOUT_DELAY_MS.
function announceWhenFree(audioId) {
    if (announcerActive) announcerQueue.push({ audioId, queuedAt: performance.now() });
    else announce(audioId);
}

function wait(ms) {
    return new Promise(resolve => schedule(resolve, ms));
}

// ===== SETTINGS PERSISTENCE =====

function saveSettings() {
    try {
        if (voiceSelect) localStorage.setItem('rkrc_voice', voiceSelect.value);
        if (raceTimeSelect) localStorage.setItem('rkrc_race_time', raceTimeSelect.value);
        if (practiceModeCheckbox) localStorage.setItem('rkrc_practice_mode', practiceModeCheckbox.checked);
    } catch (e) {}
}

function loadSettings() {
    try {
        const voice = localStorage.getItem('rkrc_voice');
        if (voice && voiceSelect) voiceSelect.value = voice;

        const raceTime = localStorage.getItem('rkrc_race_time');
        if (raceTime && raceTimeSelect) raceTimeSelect.value = raceTime;

        const practiceMode = localStorage.getItem('rkrc_practice_mode');
        if (practiceMode === 'true' && practiceModeCheckbox) {
            practiceModeCheckbox.checked = true;
            togglePracticeMode();
        }
    } catch (e) {}
}

loadSettings();

// Begin decoding audio files immediately — decodeAudioData doesn't need a user gesture
preloadVoice(voiceSelect ? voiceSelect.value : 'america');

// ===== PWA SERVICE WORKER =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => {
                reg.update();
                reg.addEventListener('updatefound', () => {
                    const w = reg.installing;
                    w.addEventListener('statechange', () => {
                        if (w.state === 'installed' && navigator.serviceWorker.controller) {
                            showVisualNotification('Update available — refresh to update.', 5000);
                        }
                    });
                });
            })
            .catch(e => console.warn('[PWA] Registration failed:', e));
    });
}

// ===== HELPERS =====

// Race-related timeouts, tracked so Restart can cancel them all
const pendingTimeouts = new Set();

function schedule(fn, ms) {
    const id = setTimeout(() => { pendingTimeouts.delete(id); fn(); }, ms);
    pendingTimeouts.add(id);
}

function clearPendingTimeouts() {
    pendingTimeouts.forEach(clearTimeout);
    pendingTimeouts.clear();
}

function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 3000;
}

function showVisualNotification(message, durationMs = 3000) {
    const container = document.getElementById('visualNotificationContainer');
    if (!container) return;
    while (container.children.length >= 3) container.removeChild(container.firstChild);
    const el = document.createElement('div');
    el.className = 'visual-notification';
    el.textContent = message;
    el.style.cssText = `
        background:#fff;border:2px solid #007bff;border-radius:5px;
        padding:10px 20px;font-size:18px;font-weight:bold;color:#333;
        box-shadow:0 0 10px rgba(0,0,0,.3);margin:10px auto;text-align:center;
        max-width:300px;animation:fadeInOut ${durationMs / 1000}s forwards;
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), durationMs);
}

function showCountdown(text, isGo = false) {
    const el = document.createElement('div');
    el.className = isGo ? 'countdown-display go' : 'countdown-display';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// ===== BACKGROUND COLOR =====

function updateBackgroundColor() {
    document.body.classList.remove('checkerboard');
    if (!isRunning && secondsLeft <= 0 && !isPracticeMode) {
        document.body.classList.add('checkerboard');
    } else if (isRedFlag) {
        document.body.style.backgroundColor = '#e74c3c';
    } else if (isYellowFlag) {
        document.body.style.backgroundColor = '#f1c40f';
    } else if (isRunning) {
        document.body.style.backgroundColor = '#2ecc71';
    } else {
        document.body.style.backgroundColor = '#f0f0f0';
    }
}

// ===== FLAG COUNTS =====

function resetFlagCounts() {
    yellowFlagCount = 0;
    redFlagCount = 0;
    const display = document.getElementById('flagCountDisplay');
    if (display) { display.style.display = 'none'; display.innerHTML = ''; }
}

function displayFlagCounts() {
    const display = document.getElementById('flagCountDisplay');
    if (display) {
        display.style.display = 'block';
        display.innerHTML = `
            <h3>Race Summary</h3>
            <p>Yellow Flags Thrown: ${yellowFlagCount}</p>
            <p>Red Flags Thrown: ${redFlagCount}</p>
        `;
    } else {
        alert(`Race Ended!\nYellow Flags: ${yellowFlagCount}\nRed Flags: ${redFlagCount}`);
    }
}

// ===== PRACTICE MODE =====

function togglePracticeMode() {
    isPracticeMode = practiceModeCheckbox.checked;
    if (isPracticeMode) {
        raceTimeSelect.disabled = true;
        document.querySelector('.settings').classList.add('practice-mode');
        if (!document.querySelector('.practice-mode-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'practice-mode-indicator';
            indicator.textContent = 'PRACTICE MODE - No Time Limit';
            const section = document.querySelector('.practice-mode-section');
            section.parentNode.insertBefore(indicator, section.nextSibling);
        }
        timerDisplay.textContent = 'PRACTICE';
        timerDisplay.classList.add('practice');
    } else {
        raceTimeSelect.disabled = false;
        document.querySelector('.settings').classList.remove('practice-mode');
        const indicator = document.querySelector('.practice-mode-indicator');
        if (indicator) indicator.remove();
        timerDisplay.classList.remove('practice');
        updateTimerDisplay();
    }
}

if (practiceModeCheckbox) {
    practiceModeCheckbox.addEventListener('change', () => {
        togglePracticeMode();
        saveSettings();
    });
}

// ===== VOICE SELECTOR =====

if (voiceSelect) {
    voiceSelect.addEventListener('change', () => {
        saveSettings();
        const voice = voiceSelect.value;
        // Clear voice-specific cached buffers, keep shared ones
        Object.keys(audioBuffers).forEach(key => {
            if (key.includes(':')) delete audioBuffers[key];
        });
        preloadVoice(voice);
    });
}

if (raceTimeSelect) {
    raceTimeSelect.addEventListener('change', saveSettings);
}

// ===== TIMER =====

function updateTimerDisplay() {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    const time = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (isPracticeMode) {
        timerDisplay.textContent = (!isRunning && secondsLeft === 0) ? 'PRACTICE' : `PRACTICE: ${time}`;
    } else {
        timerDisplay.textContent = time;
    }
}

function checkTimeMarks() {
    const currentMinute = Math.floor(secondsLeft / 60);
    const currentSecond = secondsLeft % 60;
    if (currentMinute !== lastMinutePlayed && currentSecond === 0 && currentMinute > 0 && currentMinute < 10) {
        announceWhenFree(`${currentMinute}-minute`);
        lastMinutePlayed = currentMinute;
    }
    if (secondsLeft === 30 && !hasPlayed30Seconds) {
        announceWhenFree('30-seconds');
        hasPlayed30Seconds = true;
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (!isRunning) return;
        if (isPracticeMode) {
            secondsLeft++;
            updateTimerDisplay();
        } else if (secondsLeft > 0) {
            secondsLeft--;
            updateTimerDisplay();
            checkTimeMarks();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            raceActive = false;
            raceSessionId++;
            clearPendingTimeouts();
            stopAllSounds();
            announce('endSound');
            updateBackgroundColor();
            disableButtons();
            displayFlagCounts();
            try { noSleep.disable(); } catch (e) {}
        }
    }, 1000);
}

function disableButtons() {
    yellowFlagBtn.disabled = true;
    redFlagBtn.disabled = true;
    restartBtn.disabled = false;
}

// ===== START RACE =====

startRaceBtn.addEventListener('click', () => {
    // Resume AudioContext synchronously — this call in a user gesture handler
    // satisfies iOS Safari's requirement for audio to be unlocked by user interaction.
    if (audioContext && audioContext.state !== 'running') {
        audioContext.resume();
    }

    if (isPracticeMode) {
        totalSeconds = 0;
        secondsLeft = 0;
        timerDisplay.textContent = '00:00';
    } else {
        totalSeconds = parseInt(raceTimeSelect.value) * 60;
        secondsLeft = totalSeconds;
        updateTimerDisplay();
    }

    raceTimeSelect.disabled = true;
    practiceModeCheckbox.disabled = true;
    voiceSelect.disabled = true;
    startRaceBtn.disabled = true;
    // Flags stay disabled until GO so flag calls can't talk over the start sequence
    yellowFlagBtn.disabled = true;
    redFlagBtn.disabled = true;
    restartBtn.disabled = false;
    resetFlagCounts();
    raceActive = true;

    try { noSleep.enable(); } catch (e) {
        showVisualNotification('Note: Screen may sleep during race', 3000);
    }

    const sessionId = ++raceSessionId;

    // After the engines callout finishes (min 3s): countdown beeps (4, 3, 2, 1) then random 2–3s delay then GO
    Promise.all([announce('startEnginesSound'), wait(3000)]).then(() => {
        if (sessionId !== raceSessionId) return;
        let beepCount = 0;
        const playNextBeep = () => {
            if (sessionId !== raceSessionId) return;
            if (beepCount < 4) {
                showCountdown(4 - beepCount);
                playSound('beepSound').then(() => {
                    beepCount++;
                    schedule(playNextBeep, 1000);
                });
            } else {
                const randomDelay = Math.floor(Math.random() * 1000) + 2000;
                schedule(() => {
                    if (sessionId !== raceSessionId) return;
                    showCountdown('GO!', true);
                    playSound('startBeepSound');
                    yellowFlagBtn.disabled = false;
                    redFlagBtn.disabled = false;
                    isRunning = true;
                    updateBackgroundColor();
                    startTimer();
                }, randomDelay);
            }
        };
        playNextBeep();
    });
});

// ===== FLAG BUTTONS =====

// No-steward mode: "get ready" plays, then the flag clears after a random 3–6s from the click,
// but never sooner than 1–3s (random) after "get ready" finishes, so the clips never overlap
// and the clear stays unpredictable even with long announcer clips.
function clearFlagAfterDelay(clearFn) {
    const sessionId = raceSessionId;
    yellowFlagBtn.disabled = true;
    redFlagBtn.disabled = true;
    const afterGetReady = announce('getReadySound').then(() => wait(Math.random() * 2000 + 1000));
    Promise.all([afterGetReady, wait(getRandomDelay())]).then(() => {
        if (sessionId !== raceSessionId) return;
        clearFn();
        yellowFlagBtn.disabled = false;
        redFlagBtn.disabled = false;
    });
}

yellowFlagBtn.addEventListener('click', () => {
    isYellowFlag = !isYellowFlag;
    if (isYellowFlag) {
        announce('yellowOnSound');
        yellowFlagBtn.textContent = 'Clear Yellow Flag';
        yellowFlagCount++;
        updateBackgroundColor();
    } else {
        const clearYellow = () => {
            announce('yellowOffSound');
            yellowFlagBtn.textContent = 'Yellow Flag';
            updateBackgroundColor();
        };
        if (isNoStewardPage) clearFlagAfterDelay(clearYellow);
        else clearYellow();
    }
});

redFlagBtn.addEventListener('click', () => {
    isRedFlag = !isRedFlag;
    if (isRedFlag) {
        announce('redOnSound');
        isRunning = false;
        clearInterval(timerInterval);
        redFlagBtn.textContent = 'Clear Red Flag';
        redFlagCount++;
        updateBackgroundColor();
    } else {
        const clearRed = () => {
            announce('redOffSound');
            isRunning = true;
            startTimer();
            redFlagBtn.textContent = 'Red Flag';
            updateBackgroundColor();
        };
        if (isNoStewardPage) clearFlagAfterDelay(clearRed);
        else clearRed();
    }
});

// ===== RESTART =====

// Same in both modes: stops all audio and pending race steps, resets, then plays the restart call.
restartBtn.addEventListener('click', () => {
    if (raceActive && !confirm('Restart the race?')) return;
    raceActive = false;
    raceSessionId++;
    clearPendingTimeouts();
    stopAllSounds();
    clearInterval(timerInterval);
    isRunning = false;
    if (isPracticeMode) {
        secondsLeft = 0;
        timerDisplay.textContent = 'PRACTICE';
    } else {
        secondsLeft = totalSeconds;
        updateTimerDisplay();
    }
    isYellowFlag = false;
    isRedFlag = false;
    yellowFlagBtn.textContent = 'Yellow Flag';
    redFlagBtn.textContent = 'Red Flag';
    raceTimeSelect.disabled = isPracticeMode;
    practiceModeCheckbox.disabled = false;
    voiceSelect.disabled = false;
    startRaceBtn.disabled = false;
    yellowFlagBtn.disabled = true;
    redFlagBtn.disabled = true;
    restartBtn.disabled = true;
    lastMinutePlayed = -1;
    hasPlayed30Seconds = false;
    resetFlagCounts();
    announce('restartSound');
    updateBackgroundColor();
    try { noSleep.disable(); } catch (e) {}
});
