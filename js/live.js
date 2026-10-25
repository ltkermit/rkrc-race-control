// ===== LIVE BROADCAST =====
// Sends race state to rkrc.club so members can follow races at rkrc.club/live.
// Fire-and-forget: sends never block the timer or audio, failures retry quietly,
// and only the latest state is kept — except an 'ended' state, which is always
// delivered first because it is what records the race in the history.

const liveBroadcast = (() => {
    const DEFAULT_ENDPOINT = 'https://rkrc.club/api/live-race';
    const ACTIVE_STATUSES = ['countdown', 'running', 'yellow', 'red'];
    const HEARTBEAT_MS = 30000;
    const REQUEST_TIMEOUT_MS = 8000;
    const RETRY_DELAYS_MS = [2000, 5000, 10000, 30000];

    const toggle = document.getElementById('liveBroadcast');
    const statusEl = document.getElementById('liveStatus');
    const tokenForm = document.getElementById('liveTokenForm');
    const tokenInput = document.getElementById('liveToken');
    const tokenSaveBtn = document.getElementById('liveTokenSave');
    const tokenChangeBtn = document.getElementById('liveTokenChange');

    let getState = () => null;
    let seq = 0;
    let queue = [];              // states waiting to send; at most one non-'ended' state
    let inFlight = false;
    let retryCount = 0;
    let retryTimer = null;

    function storageGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function storageSet(key, value) {
        try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch (e) {}
    }

    // Endpoint can be overridden for testing: localStorage.rkrc_live_endpoint
    const endpoint = () => storageGet('rkrc_live_endpoint') || DEFAULT_ENDPOINT;
    const token = () => storageGet('rkrc_live_token');
    const isEnabled = () => storageGet('rkrc_live_enabled') === 'true' && !!token();

    function setStatus(text, kind) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.className = `live-status ${kind || ''}`;
    }

    function enqueue(state) {
        queue = queue.filter(s => s.status === 'ended');
        queue.push({ ...state, seq: ++seq });
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        flush();
    }

    function scheduleRetry() {
        const delay = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
        retryCount++;
        retryTimer = setTimeout(() => { retryTimer = null; flush(); }, delay);
    }

    async function flush() {
        if (inFlight || retryTimer || !queue.length) return;
        const body = queue[0];
        inFlight = true;
        setStatus('Sending…', 'sending');

        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeout = controller && setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let retry = false;
        try {
            const response = await fetch(endpoint(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token()}`,
                },
                body: JSON.stringify(body),
                signal: controller ? controller.signal : undefined,
            });
            if (response.ok) {
                retryCount = 0;
                setStatus('Live', 'ok');
            } else if (response.status === 401 || response.status === 403) {
                queue = [];
                setStatus('Token rejected', 'error');
                showTokenForm();
            } else if (response.status === 429 || response.status >= 500) {
                retry = true;
            } else {
                // Other 4xx: the server won't ever accept this state, so drop it
                console.warn('[Live] State rejected:', response.status, body);
                setStatus('Live (last update rejected)', 'error');
            }
        } catch (e) {
            retry = true;
        } finally {
            if (timeout) clearTimeout(timeout);
        }

        if (!retry && queue[0] === body) queue.shift();
        inFlight = false;
        if (retry) {
            setStatus('Offline — retrying', 'error');
            scheduleRetry();
        } else {
            flush();
        }
    }

    // Called by the timer whenever the race state changes
    function notify() {
        if (!isEnabled()) return;
        const state = getState();
        if (state) enqueue(state);
    }

    // Re-send the current state while a race is on so the site knows the track is still connected
    setInterval(() => {
        if (!isEnabled()) return;
        const state = getState();
        if (state && ACTIVE_STATUSES.includes(state.status)) enqueue(state);
    }, HEARTBEAT_MS);

    // ===== UI =====

    function showTokenForm() {
        if (tokenForm) tokenForm.hidden = false;
        if (tokenChangeBtn) tokenChangeBtn.hidden = true;
        if (tokenInput) tokenInput.focus();
    }

    function refreshUi() {
        const enabled = isEnabled();
        if (toggle) toggle.checked = enabled;
        if (tokenForm) tokenForm.hidden = true;
        if (tokenChangeBtn) tokenChangeBtn.hidden = !token();
        setStatus(enabled ? 'On' : '', enabled ? 'ok' : '');
        document.dispatchEvent(new CustomEvent('livebroadcastchange', { detail: { enabled } }));
    }

    if (toggle) {
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                if (!token()) { toggle.checked = false; showTokenForm(); return; }
                storageSet('rkrc_live_enabled', 'true');
                refreshUi();
                notify();
            } else {
                // Tell the site the broadcast is over rather than leaving it to go stale
                const state = getState();
                if (state) enqueue({ ...state, status: 'idle' });
                storageSet('rkrc_live_enabled', 'false');
                refreshUi();
            }
        });
    }

    if (tokenSaveBtn) {
        tokenSaveBtn.addEventListener('click', () => {
            const value = tokenInput.value.trim();
            if (!value) return;
            storageSet('rkrc_live_token', value);
            storageSet('rkrc_live_enabled', 'true');
            tokenInput.value = '';
            refreshUi();
            notify();
        });
    }

    if (tokenChangeBtn) tokenChangeBtn.addEventListener('click', showTokenForm);

    refreshUi();

    return {
        init(stateFn) { getState = stateFn; },
        notify,
        isEnabled,
        endpoint,
        token,
    };
})();
