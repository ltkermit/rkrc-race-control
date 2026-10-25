# Changelog

All notable changes to RKRC Race Control are documented here.

---

## v1.8.7 — 2026-10-24

### Fixed
- The "Pick drivers" and "Finishing order" windows were cut off on the right on narrower phones, which could hide the Add, Done and Submit buttons. They now fit the screen.

---

## v1.8.6 — 2026-10-24

### Added
- Race results: with broadcast on, use "Pick drivers" before the start to choose who's racing, from club members (downloaded from rkrc.club) or guests (kept on this device). At the checkered flag, tap drivers in finishing order and mark the rest DNF or DNS. Results are saved to the race on rkrc.club/live, and are kept on the device and resent until rkrc.club confirms them. Use "Enter results" or "Edit results" to fill them in later, until the next race starts.

---

## v1.8.5 — 2026-10-24

### Added
- Live broadcast: turn on "Broadcast live to rkrc.club" on the timer page (enter the club's broadcast token once) and members can follow the race at rkrc.club/live. Finished races are recorded in a race history there. Sending never holds up the timer or audio; if the connection drops, updates retry quietly in the background.

---

## v1.8.4 — 2026-10-24

### Fixed
- iOS: the restart call didn't play after confirming a restart. The native confirm dialog suspends audio on iOS, and the tap that closes it can't resume it. Restart now uses an in-page confirm dialog, and every button resumes audio within its own tap.

---

## v1.8.3 — 2026-10-24

### Added
- DJT announcer voice.

### Changed
- Announcer audio now plays one clip at a time. A new call (flag, flag clear, start, end, restart) cuts off whatever is playing, and time callouts wait for the current clip to finish. A callout that would play more than 5 seconds late is skipped.
- The start countdown now begins after the "start your engines" call finishes (minimum 3 seconds), so long announcer clips no longer overlap the beeps.
- No-steward mode: a flag now clears 1–3 seconds (random) after "get ready" finishes, and never sooner than the usual random 3–6 seconds from the click.
- Yellow and red flag buttons are disabled until GO.
- Restart works the same in both modes: it stops all audio and pending race steps and always plays the restart call. It asks for confirmation whenever a race is underway (including during the start sequence and while a flag is clearing), but not after a race has ended.

### Fixed
- Restart audio fixes not reaching the live site: server and browser caches kept serving the old script. Pages now load `script.js` and `style.css` with a version query, the service worker bypasses the HTTP cache when installing, and the `.htaccess` no-cache rule for the service worker now actually applies.
- In no-steward mode, a pending flag clear could fire after Restart or after the race ended, restarting the clock or re-enabling the flag buttons.
- A red flag thrown during the start sequence was overridden when the race went green.
- Restarting in practice mode re-enabled the race time selector.

---

## v1.8.2 — 2026-05-16

### Added
- Settings persistence: selected announcer voice, race duration, and practice mode are now saved and restored automatically between sessions.
- Confirm dialog when restarting a race that is in progress (including during a flag).

### Changed
- Restarting after a race has ended is now silent — no audio and no confirmation prompt.

---

## v1.8.1 — 2026-05-16

### Added
- `.htaccess` for Apache hosting: correct MIME types for MP3/WAV, caching headers, and service worker headers.

### Fixed
- Reworked audio system to use Web Audio API exclusively, resolving iOS Safari audio reliability issues. The `AudioContext` is now resumed synchronously on the first user gesture (Start Race button), which satisfies iOS's requirement that audio be initiated by direct user interaction.
- Audio buffers are now decoded and preloaded at page load for all browsers (previously only loaded for Apple/Safari).
- Service worker cache list had mismatched filenames (e.g. `start-engines.mp3` vs. the actual file `startengines.mp3`) causing offline mode to silently fail. Corrected all entries.
- Removed broken references to non-existent icon and screenshot files from `manifest.json`.

### Removed
- Audio unlock modal and Firefox recommendation banner — no longer needed with the corrected audio unlock approach.
- 20 unused `<audio>` HTML elements — audio URLs are now managed directly in JavaScript.

---

## v1.7.1 — 2026-01-18

### Added
- Dee Liffy announcer voice (voiced by Dee Liffy).
- PWA app icons for all standard device sizes (72×72 through 512×512).
- PWA diagnostic page (`pwa-status.html`) for troubleshooting offline issues.

---

## v1.7.0 — 2026-01-04

### Added
- Progressive Web App (PWA) support: service worker for offline caching, `manifest.json`, installable to home screen.
- App can now be used without an internet connection after the first visit.

---

## v1.6.3

### Fixed
- Web Audio API buffer system introduced for Safari/iOS to improve audio playback reliability.
- Audio unlock modal added to satisfy iOS requirement for user gesture before audio.

---

## v1.6.2

### Fixed
- Further Safari audio fixes and general code improvements.

---

## v1.6.1

### Changed
- Development tooling updated to use Claude Code for assisted development.

---

## v1.6.0

### Added
- European and NASCAR announcer voices (previously only American).
- Race summary displayed at race end showing yellow and red flag counts.
- Practice mode (counts up instead of down, no race end condition).

---

## Pre-1.6

### Added
- Initial race timer with steward and no-steward modes.
- No-steward mode: random 3–6 second delay before clearing flags.
- Audio callouts at each remaining minute and at 30 seconds.
- Countdown beep sequence (4-3-2-1) before race start.
- Red flag pauses the timer; yellow flag does not.
- Screen wake lock via NoSleep.js to prevent mobile screens from sleeping.
- Checkerboard background pattern when race ends.
