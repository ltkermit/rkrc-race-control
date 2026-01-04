# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RKRC Race Control is a web-based racing timer application for RC (radio-controlled) car racing events. It's a mobile-friendly, single-page application that runs entirely in the browser with no backend dependencies.

**Live Site:** https://control.rkrc.club/

## Architecture

### Application Structure

The app uses a simple multi-page architecture with shared JavaScript:

- `index.html` - Landing page with mode selection
- `steward.html` - Race timer where steward manually controls flag clearing
- `nosteward.html` - Race timer with automatic random delay (3-6s) for flag clearing
- `instructions.html` - Usage documentation
- `js/script.js` - Single shared JavaScript file used by both timer pages
- `css/style.css` - Shared styling

### Key Architectural Patterns

**Mode Detection:** The script detects which page it's running on using:
```javascript
const isNoStewardPage = window.location.pathname.includes('nosteward.html');
```
This single variable controls behavior differences between steward and no-steward modes.

**State Management:** Race state is managed through global variables:
- `isRunning` - Whether race is active
- `isYellowFlag` / `isRedFlag` - Current flag states
- `isPracticeMode` - Practice mode (counts up instead of down)
- `secondsLeft` - Current timer value

**Background Color Signaling:** The page background color indicates race state:
- Gray (#f0f0f0) - Not running
- Green (#2ecc71) - Race running
- Yellow (#f1c40f) - Yellow flag active
- Red (#e74c3c) - Red flag active (timer paused)
- Checkerboard pattern - Race ended

### Audio System

**Three-Voice System:** Audio files are organized in three directories:
- `audio/america/` - American announcer (default)
- `audio/europe/` - European announcer (files prefixed with `e-`)
- `audio/merica/` - NASCAR announcer (files prefixed with `n-`)

**Dynamic Audio Source Switching:** The `updateAudioSources()` function dynamically updates all `<audio>` element sources when the user changes the announcer voice selector. Audio files are named consistently across directories (e.g., `start-engines.mp3`, `e-start-engines.mp3`, `n-start-engines.mp3`).

**iOS/Safari Audio Workarounds:** Due to iOS Safari audio restrictions:
- Web Audio API context is initialized and resumed before playback
- Audio unlock modal prompts user interaction on Apple devices
- `playAudioWithRetry()` function retries failed audio playback
- Firefox browser is recommended for iOS users (shown via banner)
- Visual notifications shown as fallback when audio fails

### Race Start Sequence

The start sequence is carefully timed:
1. "Start your engines" audio plays immediately
2. 3-second delay
3. Four beeps at 1-second intervals with countdown display (4, 3, 2, 1)
4. Random 2-3 second delay after last beep
5. Start beep plays, "GO!" appears, timer starts

### NoSleep Integration

The app uses `NoSleep.js` to prevent mobile screens from sleeping during races:
- Enabled when "Start Race" is clicked
- Disabled when race ends or is restarted

### Practice Mode

When enabled:
- Timer counts up from 00:00 instead of counting down
- No race end condition
- Race time selector is disabled
- Display shows "PRACTICE" when not running

## Development Notes

### Testing Audio

Audio files were created using ElevenLabs text-to-speech:
- **American Voice (Arthur):** TtRFBnwQdH1k01vR0hMz
- **European Voice (Dexter):** oTQK6KgOJHp8UGGZjwUu
- **NASCAR Voice (Cowboy Chris):** o3VpiaQ9JcGIFpOrkHHf

### Common Audio Files

Beep sounds are shared across all voice modes:
- `audio/beep.mp3` - Countdown beep
- `audio/start-beep.mp3` - Final start beep

### HTML Structure

Both `steward.html` and `nosteward.html` have identical structure:
- Same `<audio>` elements (same IDs, same default `src` paths)
- Same control buttons with same IDs
- Same DOM structure for script compatibility
- Only difference is the page title/heading

The shared script (`js/script.js`) relies on these consistent element IDs to function on both pages.

### Important Implementation Details

**Flag Clearing Logic:** In no-steward mode, when clearing a flag:
1. "Get ready" sound plays immediately
2. Yellow/Red flag buttons are disabled to prevent re-clicking
3. Random delay (3-6s) occurs
4. Flag clears with appropriate sound
5. Buttons re-enabled after delay completes

**Timer Callouts:** Audio plays at specific intervals:
- Every full minute remaining (`X-minute.mp3`)
- At 30 seconds remaining (`30-seconds.mp3`)
- Uses `lastMinutePlayed` and `hasPlayed30Seconds` to prevent duplicate callouts

**Flag Count Tracking:** Yellow and red flag counts are tracked during the race and displayed in a summary when the race ends.

## Known Issues

**iOS Safari Audio:** Audio playback is unreliable on iOS Safari. Firefox on iOS is recommended for the best experience. The app includes:
- Modal to prompt audio unlock on Apple devices
- Dismissible Firefox recommendation banner
- Console logging for debugging audio issues
- Retry mechanisms and fallback notifications
