// ===== DRIVERS & RESULTS =====
// Drivers are club members (roster downloaded from rkrc.club and cached on this device, so it
// works without signal at the track) or guests (typed here and kept on this device only).
// The steward picks who's racing before the start. At the checkered flag they tap drivers in
// finishing order and mark the rest DNF or DNS. Results are hand-entered, so unlike live state
// they wait in a saved queue on this device until rkrc.club confirms them.

const raceDrivers = (() => {
    const MAX_DRIVERS = 30;
    const MAX_GUESTS = 30;
    const MAX_NAME_LENGTH = 40;
    const RETRY_DELAYS_MS = [3000, 10000, 30000, 60000];
    const NOT_FOUND_GIVE_UP_MS = 10 * 60 * 1000;   // the race may not be recorded yet; give up after this

    const section = document.getElementById('driversSection');
    const pickBtn = document.getElementById('pickDrivers');
    const summaryEl = document.getElementById('driversSummary');
    const resultsPrompt = document.getElementById('resultsPrompt');
    const enterResultsBtn = document.getElementById('enterResults');
    const resultsStatusEl = document.getElementById('resultsStatus');
    const practiceCheckbox = document.getElementById('practiceMode');

    function load(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (e) { return fallback; }
    }

    function save(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }

    let members = load('rkrc_roster_members', []);     // [{ memberId, name, raceNumber }]
    let guests = load('rkrc_guests', []);               // guest names, most recent first
    let selected = load('rkrc_selected_drivers', []);   // [{ memberId, name }]; kept for the next race
    let resultsQueue = load('rkrc_results_queue', []);  // [{ raceId, entries, queuedAt }]
    let currentRace = null;      // { raceId, drivers } while a race with drivers is underway
    let resultsRace = null;      // { raceId, drivers, draft } finished race whose results can be entered
    let sending = false;
    let retryCount = 0;
    let retryTimer = null;

    const keyOf = d => (d.memberId !== null && d.memberId !== undefined) ? `m:${d.memberId}` : `g:${d.name.toLowerCase()}`;
    const cleanName = name => String(name).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);

    function notifyUser(message, ms) {
        if (typeof showVisualNotification === 'function') showVisualNotification(message, ms);
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    // ===== ROSTER =====

    async function refreshRoster() {
        if (!liveBroadcast.token()) return;
        try {
            const response = await fetch(`${liveBroadcast.endpoint()}/roster`, {
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${liveBroadcast.token()}` },
            });
            if (!response.ok) return;
            const data = await response.json();
            if (!Array.isArray(data.members)) return;
            members = data.members
                .filter(m => m && Number.isInteger(m.memberId) && m.name)
                .map(m => ({ memberId: m.memberId, name: String(m.name), raceNumber: m.raceNumber || null }));
            save('rkrc_roster_members', members);

            // Keep picked members' names current and drop anyone no longer on the roster
            selected = selected
                .filter(d => d.memberId === null || members.some(m => m.memberId === d.memberId))
                .map(d => d.memberId === null ? d : { memberId: d.memberId, name: members.find(m => m.memberId === d.memberId).name });
            save('rkrc_selected_drivers', selected);
            renderSummary();
            if (pickerRender) pickerRender();
        } catch (e) {}
    }

    // ===== PRE-RACE PICKER =====

    let pickerRender = null;   // re-renders the open picker, if any

    function renderSummary() {
        if (!summaryEl) return;
        summaryEl.textContent = selected.length
            ? `${selected.length} driver${selected.length === 1 ? '' : 's'}: ${selected.map(d => d.name).join(', ')}`
            : 'No drivers picked';
    }

    function updateVisibility() {
        if (!section) return;
        section.hidden = !liveBroadcast.isEnabled() || (practiceCheckbox && practiceCheckbox.checked);
    }

    function isSelected(driver) {
        const key = keyOf(driver);
        return selected.some(d => keyOf(d) === key);
    }

    function setSelected(driver, on) {
        const key = keyOf(driver);
        selected = selected.filter(d => keyOf(d) !== key);
        if (on) {
            if (selected.length >= MAX_DRIVERS) {
                notifyUser(`Up to ${MAX_DRIVERS} drivers per race`, 2500);
                return false;
            }
            selected.push({ memberId: driver.memberId ?? null, name: driver.name });
        }
        save('rkrc_selected_drivers', selected);
        renderSummary();
        return true;
    }

    function addGuest(rawName) {
        const name = cleanName(rawName);
        if (!name) return;
        const existing = guests.find(g => g.toLowerCase() === name.toLowerCase());
        guests = [existing || name, ...guests.filter(g => g !== existing)];
        // Trim the oldest unpicked guests once the list is full
        while (guests.length > MAX_GUESTS) {
            const index = guests.map(g => isSelected({ memberId: null, name: g })).lastIndexOf(false);
            if (index === -1) break;
            guests.splice(index, 1);
        }
        save('rkrc_guests', guests);
        setSelected({ memberId: null, name: existing || name }, true);
    }

    function removeGuest(name) {
        setSelected({ memberId: null, name }, false);
        guests = guests.filter(g => g !== name);
        save('rkrc_guests', guests);
    }

    function openPicker() {
        refreshRoster();
        const overlay = el('div', 'confirm-overlay');
        const box = el('div', 'confirm-box driver-box');
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', "Who's racing?");
        box.innerHTML = `
            <p>Who's racing?</p>
            <input type="search" class="driver-filter" placeholder="Search drivers" aria-label="Search drivers">
            <div class="driver-list"></div>
            <form class="guest-add">
                <input type="text" maxlength="${MAX_NAME_LENGTH}" placeholder="Add a guest" aria-label="Guest name">
                <button type="submit">Add</button>
            </form>
            <div class="driver-actions">
                <button type="button" class="confirm-cancel driver-clear">Clear</button>
                <button type="button" class="driver-done">Done</button>
            </div>`;
        overlay.appendChild(box);

        const filterInput = box.querySelector('.driver-filter');
        const list = box.querySelector('.driver-list');

        function checkboxRow(driver, label, extra) {
            const row = el('label', 'driver-row');
            const check = el('input');
            check.type = 'checkbox';
            check.checked = isSelected(driver);
            check.addEventListener('change', () => {
                if (!setSelected(driver, check.checked)) check.checked = false;
            });
            row.append(check, el('span', 'driver-name', label));
            if (extra) row.appendChild(extra);
            return row;
        }

        pickerRender = () => {
            const filter = filterInput.value.trim().toLowerCase();
            const matches = name => !filter || name.toLowerCase().includes(filter);
            list.replaceChildren();

            list.appendChild(el('h4', 'driver-heading', 'Members'));
            const shownMembers = members.filter(m => matches(m.name));
            if (!members.length) {
                list.appendChild(el('div', 'driver-empty', 'Member list not downloaded yet. It loads when this phone is online with broadcast on.'));
            } else if (!shownMembers.length) {
                list.appendChild(el('div', 'driver-empty', 'No matching members'));
            }
            shownMembers.forEach(m => {
                const label = m.raceNumber ? `${m.name} #${m.raceNumber}` : m.name;
                list.appendChild(checkboxRow(m, label));
            });

            list.appendChild(el('h4', 'driver-heading', 'Guests'));
            const shownGuests = guests.filter(matches);
            if (!shownGuests.length) list.appendChild(el('div', 'driver-empty', guests.length ? 'No matching guests' : 'No guests yet'));
            shownGuests.forEach(name => {
                const remove = el('button', 'driver-remove', '×');
                remove.type = 'button';
                remove.setAttribute('aria-label', `Remove guest ${name}`);
                remove.addEventListener('click', e => { e.preventDefault(); removeGuest(name); pickerRender(); });
                list.appendChild(checkboxRow({ memberId: null, name }, name, remove));
            });
        };

        filterInput.addEventListener('input', pickerRender);
        box.querySelector('.guest-add').addEventListener('submit', e => {
            e.preventDefault();
            const input = e.target.querySelector('input');
            addGuest(input.value);
            input.value = '';
            filterInput.value = '';
            pickerRender();
        });
        box.querySelector('.driver-clear').addEventListener('click', () => {
            selected = [];
            save('rkrc_selected_drivers', selected);
            renderSummary();
            pickerRender();
        });
        box.querySelector('.driver-done').addEventListener('click', () => {
            pickerRender = null;
            overlay.remove();
        });

        pickerRender();
        document.body.appendChild(overlay);
    }

    // ===== RESULTS ENTRY =====

    function openResults() {
        if (!resultsRace) return;
        const race = resultsRace;
        const draft = race.draft || { order: [], marks: {} };   // order: keys of finishers; marks: key -> 'dnf' | 'dns'
        race.draft = draft;
        const byKey = Object.fromEntries(race.drivers.map(d => [keyOf(d), d]));

        const overlay = el('div', 'confirm-overlay');
        const box = el('div', 'confirm-box driver-box results-box');
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', 'Finishing order');
        overlay.appendChild(box);

        function close() { overlay.remove(); updateResultsPrompt(); }

        function render() {
            box.replaceChildren();
            box.appendChild(el('p', null, 'Finishing order'));

            const placed = el('ol', 'results-placed');
            draft.order.forEach((key, i) => {
                const row = el('li', 'results-row placed');
                row.append(el('span', 'results-pos', String(i + 1)), el('span', 'driver-name', byKey[key].name));
                const undo = el('button', 'driver-remove', '×');
                undo.type = 'button';
                undo.setAttribute('aria-label', `Unplace ${byKey[key].name}`);
                undo.addEventListener('click', () => { draft.order.splice(i, 1); render(); });
                row.appendChild(undo);
                placed.appendChild(row);
            });
            Object.entries(draft.marks).forEach(([key, mark]) => {
                const row = el('li', 'results-row marked');
                row.append(el('span', 'results-pos', mark.toUpperCase()), el('span', 'driver-name', byKey[key].name));
                const undo = el('button', 'driver-remove', '×');
                undo.type = 'button';
                undo.setAttribute('aria-label', `Unmark ${byKey[key].name}`);
                undo.addEventListener('click', () => { delete draft.marks[key]; render(); });
                row.appendChild(undo);
                placed.appendChild(row);
            });
            if (placed.children.length) box.appendChild(placed);

            const unplaced = race.drivers.filter(d => !draft.order.includes(keyOf(d)) && !draft.marks[keyOf(d)]);
            if (unplaced.length) {
                box.appendChild(el('div', 'results-hint',
                    draft.order.length ? `Tap who finished ${ordinal(draft.order.length + 1)}` : 'Tap drivers in the order they finished'));
                unplaced.forEach(d => {
                    const key = keyOf(d);
                    const row = el('div', 'results-row unplaced');
                    const place = el('button', 'results-place', d.name);
                    place.type = 'button';
                    place.addEventListener('click', () => { draft.order.push(key); render(); });
                    const dnf = el('button', 'results-mark', 'DNF');
                    dnf.type = 'button';
                    dnf.addEventListener('click', () => { draft.marks[key] = 'dnf'; render(); });
                    const dns = el('button', 'results-mark', 'DNS');
                    dns.type = 'button';
                    dns.addEventListener('click', () => { draft.marks[key] = 'dns'; render(); });
                    row.append(place, dnf, dns);
                    box.appendChild(row);
                });
            }

            const actions = el('div', 'driver-actions');
            const skip = el('button', 'confirm-cancel', 'Later');
            skip.type = 'button';
            skip.addEventListener('click', close);
            const submit = el('button', 'driver-done', 'Submit');
            submit.type = 'button';
            submit.disabled = unplaced.length > 0;
            submit.addEventListener('click', () => {
                const entries = [
                    ...draft.order.map((key, i) => ({ ...driverRef(byKey[key]), position: i + 1, status: 'finished' })),
                    ...Object.entries(draft.marks).map(([key, mark]) => ({ ...driverRef(byKey[key]), position: null, status: mark })),
                ];
                race.submitted = true;
                enqueueResults(race.raceId, entries);
                close();
            });
            actions.append(skip, submit);
            box.appendChild(actions);
        }

        render();
        document.body.appendChild(overlay);
    }

    function ordinal(n) {
        const suffix = (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
        return `${n}${suffix}`;
    }

    const driverRef = d => ({ memberId: d.memberId ?? null, name: d.name });

    function updateResultsPrompt() {
        if (!resultsPrompt) return;
        resultsPrompt.hidden = !resultsRace && !(resultsStatusEl && resultsStatusEl.textContent);
        if (enterResultsBtn) {
            enterResultsBtn.hidden = !resultsRace;
            enterResultsBtn.textContent = resultsRace && resultsRace.submitted ? 'Edit results' : 'Enter results';
        }
    }

    function setResultsStatus(text, kind) {
        if (!resultsStatusEl) return;
        resultsStatusEl.textContent = text;
        resultsStatusEl.className = `live-status ${kind || ''}`;
        updateResultsPrompt();
    }

    // ===== RESULTS QUEUE =====

    function enqueueResults(raceId, entries) {
        resultsQueue = resultsQueue.filter(r => r.raceId !== raceId);
        resultsQueue.push({ raceId, entries, queuedAt: Date.now() });
        save('rkrc_results_queue', resultsQueue);
        retryCount = 0;
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        sendResults();
    }

    function scheduleRetry() {
        const delay = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
        retryCount++;
        retryTimer = setTimeout(() => { retryTimer = null; sendResults(); }, delay);
    }

    async function sendResults() {
        if (sending || retryTimer || !resultsQueue.length) return;
        if (!liveBroadcast.token()) { setResultsStatus('Results waiting: no broadcast token', 'error'); return; }
        const item = resultsQueue[0];
        sending = true;
        setResultsStatus('Sending results…', 'sending');

        let outcome = 'retry';
        try {
            const response = await fetch(`${liveBroadcast.endpoint()}/${encodeURIComponent(item.raceId)}/results`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${liveBroadcast.token()}`,
                },
                body: JSON.stringify({ entries: item.entries }),
            });
            if (response.ok) outcome = 'saved';
            else if (response.status === 404) outcome = Date.now() - item.queuedAt < NOT_FOUND_GIVE_UP_MS ? 'retry' : 'notfound';
            else if (response.status === 401 || response.status === 403) outcome = 'auth';
            else if (response.status === 429 || response.status >= 500) outcome = 'retry';
            else {
                outcome = 'rejected';
                console.warn('[Results] Rejected:', response.status, await response.text().catch(() => ''));
            }
        } catch (e) {}
        sending = false;

        if (outcome === 'retry') {
            setResultsStatus('Results waiting to send — retrying', 'error');
            scheduleRetry();
            return;
        }
        if (outcome === 'auth') {
            // Kept in the queue; sent again after the token is fixed or the page reloads
            setResultsStatus('Results waiting: token rejected', 'error');
            return;
        }
        resultsQueue = resultsQueue.filter(r => r !== item);
        save('rkrc_results_queue', resultsQueue);
        retryCount = 0;
        if (outcome === 'saved') {
            setResultsStatus('Results saved', 'ok');
            notifyUser('Results saved to rkrc.club', 2500);
        } else if (outcome === 'notfound') {
            setResultsStatus('Results not saved: race not found on rkrc.club', 'error');
        } else {
            setResultsStatus('Results not saved: rejected by rkrc.club', 'error');
        }
        sendResults();
    }

    // ===== RACE HOOKS (called by script.js) =====

    // Returns the drivers for the race being started, or [] if results won't be taken
    function startRace(raceId, practice) {
        resultsRace = null;
        if (resultsStatusEl && !resultsQueue.length) resultsStatusEl.textContent = '';
        if (pickBtn) pickBtn.disabled = true;
        const drivers = (liveBroadcast.isEnabled() && !practice) ? selected.map(driverRef) : [];
        currentRace = { raceId, drivers };
        updateResultsPrompt();
        return drivers;
    }

    function raceEnded() {
        if (pickBtn) pickBtn.disabled = false;
        if (currentRace && currentRace.drivers.length) {
            resultsRace = { ...currentRace, draft: null, submitted: false };
            openResults();
        }
        currentRace = null;
        updateResultsPrompt();
    }

    function raceCancelled() {
        if (pickBtn) pickBtn.disabled = false;
        currentRace = null;
        updateResultsPrompt();
    }

    // ===== INIT =====

    if (pickBtn) pickBtn.addEventListener('click', openPicker);
    if (enterResultsBtn) enterResultsBtn.addEventListener('click', openResults);
    if (practiceCheckbox) practiceCheckbox.addEventListener('change', updateVisibility);
    document.addEventListener('livebroadcastchange', e => {
        updateVisibility();
        if (e.detail.enabled) { refreshRoster(); sendResults(); }
    });
    window.addEventListener('online', () => {
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        sendResults();
    });
    // Practice mode is restored from settings after this script runs, so wait for the page
    document.addEventListener('DOMContentLoaded', updateVisibility);

    renderSummary();
    updateVisibility();
    refreshRoster();
    sendResults();

    return { startRace, raceEnded, raceCancelled };
})();
