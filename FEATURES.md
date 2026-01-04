# Feature Roadmap & Enhancement Ideas

This document tracks potential features and improvements for future development of RKRC Race Control.

## High-Priority Features

### 1. Lap Counting System ⭐⭐⭐
**Status:** Proposed
**Complexity:** Medium
**Value:** High

Currently the app only tracks time, but RC racing is about laps.

**Features:**
- Manual lap counter (button to increment on each lap)
- Display: "Lap 5/10" or "Lap 12" (unlimited)
- Best lap time tracking
- Average lap time calculation
- Audio callout on final lap ("Final lap!")

**Implementation Notes:**
- Simple counter variable
- Display next to timer
- New "Count Lap" button
- Track timestamps for lap time calculations

---

### 2. Settings Persistence ⭐⭐⭐
**Status:** Proposed
**Complexity:** Easy
**Value:** High

Settings reset on page reload. Use localStorage to remember preferences.

**Features:**
- Remember selected voice
- Remember race duration preference
- Remember practice mode preference
- "Quick Start" - remembers last race config

**Implementation Notes:**
- ~50 lines of code using localStorage API
- Save on change, load on page init
- Graceful fallback if localStorage unavailable

---

### 3. Progressive Web App (PWA) ⭐⭐⭐
**Status:** Under Investigation
**Complexity:** Medium
**Value:** High

Make it installable on phones like a native app.

**Features:**
- Works offline (race timer doesn't need internet)
- Home screen icon
- Full screen on mobile
- Better performance
- Professional appearance

**Implementation Notes:**
- Add `manifest.json`
- Create service worker for offline caching
- Update HTML with PWA meta tags
- **iOS Considerations:** See iOS_PWA_NOTES.md for details on iOS-specific limitations

---

### 4. Keyboard Shortcuts ⭐⭐
**Status:** Proposed
**Complexity:** Easy
**Value:** High

For race directors using tablets/computers.

**Shortcuts:**
- **Spacebar** = Start/Stop race
- **Y** = Yellow flag
- **R** = Red flag
- **C** = Clear flag
- **Esc** = Restart
- **P** = Pause (if pause feature added)

**Implementation Notes:**
- Event listener for keydown events
- Prevent conflicts with browser shortcuts
- Show shortcut hints in UI (tooltip or help modal)

---

### 5. Race History Log ⭐⭐
**Status:** Proposed
**Complexity:** Medium
**Value:** High

Track past races with localStorage.

**Features:**
- Date/time of race
- Duration
- Mode (steward/no steward)
- Flag counts
- Lap count (if lap counter implemented)
- Notes field
- View last 10-20 races
- Clear history button
- Export history

**Implementation Notes:**
- Store as JSON array in localStorage
- Limit to prevent storage overflow
- Consider IndexedDB for larger datasets

---

## Medium-Priority Features

### 6. Pause/Resume Feature ⭐⭐
**Status:** Proposed
**Complexity:** Easy
**Value:** Medium

Red flag pauses timer, but sometimes you just need to pause without announcement.

**Features:**
- "Pause" button (stops timer but no audio)
- Resume continues from same time
- Visual indicator when paused
- Use case: Technical difficulties, discussing a call

---

### 7. Volume Controls ⭐⭐
**Status:** Proposed
**Complexity:** Medium
**Value:** Medium

Separate volume control for different audio types.

**Features:**
- Announcer voice slider (flags, callouts)
- Beeps slider (countdown, start)
- Master volume slider
- Mute all button

**Implementation Notes:**
- Adjust Web Audio API gain nodes
- HTML5 audio volume property
- Save preferences to localStorage

---

### 8. Custom Race Times ⭐
**Status:** Proposed
**Complexity:** Easy
**Value:** Medium

Currently limited to 1-10 minutes.

**Features:**
- Text input for any duration (e.g., 4.5 minutes, 12 minutes)
- Quick presets: 2min, 5min (A-Main), 8min, 10min
- Save custom presets

---

### 9. Visual Enhancements ⭐
**Status:** Proposed
**Complexity:** Easy-Medium
**Value:** Medium

**Features:**
- Current lap/split time display
- Progress bar showing race completion percentage
- Larger timer font option for visibility from distance
- Dark mode (easier on eyes during evening races)
- Color themes

---

### 10. Pre-Race Countdown
**Status:** Proposed
**Complexity:** Medium
**Value:** Medium

Official RC racing procedure.

**Features:**
- "Racers to the grid" announcement
- "30 seconds to start" warning
- Optional marshal readiness check
- Configurable pre-race sequence

---

### 11. Export Race Data
**Status:** Proposed
**Complexity:** Easy
**Value:** Medium

Download race results.

**Formats:**
- CSV (for spreadsheets)
- JSON (for other apps)
- Text summary (shareable)
- Email results

---

### 12. Multiple Race Formats
**Status:** Proposed
**Complexity:** Hard
**Value:** Medium

Different racing modes.

**Formats:**
- **Qualifying Mode**: Track best single lap instead of race duration
- **Heat Management**: Track Round 1, Round 2, etc.
- **Main Event Mode**: Different audio, higher stakes feel
- **Endurance Mode**: Long races with pit stops

---

## Nice-to-Have Features

### 13. Racer Names/Numbers
**Status:** Proposed
**Complexity:** Medium
**Value:** Low-Medium

- Input racer name or car number
- Show on screen during race
- Included in race history
- Multiple racer tracking

---

### 14. Marshal Mode
**Status:** Proposed
**Complexity:** Hard
**Value:** Low-Medium

Special view for corner marshals.

**Features:**
- Simplified interface
- Just shows flag status and time remaining
- Synchronized with race director's timer
- Could use WebSockets or WebRTC for sync

---

### 15. Spectator Display
**Status:** Proposed
**Complexity:** Hard
**Value:** Medium

Second screen/projector view.

**Features:**
- Large timer
- Current race status
- Next race info
- Runs on separate device
- Synchronized via WebSocket/WebRTC

---

### 16. Sound Customization
**Status:** Proposed
**Complexity:** Medium-Hard
**Value:** Low

**Features:**
- Upload custom audio files
- Community sound packs
- Record your own announcer
- Sound library/marketplace

---

### 17. Statistics Dashboard
**Status:** Proposed
**Complexity:** Medium
**Value:** Low

Track metrics over time.

**Metrics:**
- Average flags per race
- Most common flag type
- Race duration trends
- Lap time improvements
- Charts and graphs

---

## Quick Wins (Easy to Implement)

### 18. Full Screen Mode
**Status:** Proposed
**Complexity:** Very Easy
**Value:** Medium

- Button to enter full screen
- Better for dedicated race control tablets
- Uses Fullscreen API

---

### 19. Confirm Restart Dialog
**Status:** Proposed
**Complexity:** Very Easy
**Value:** Low

- "Are you sure?" before restarting mid-race
- Prevent accidental restarts
- Only show if race is running

---

### 20. Timer Adjustments
**Status:** Proposed
**Complexity:** Easy
**Value:** Low

- Add/subtract 10 seconds (for timing corrections)
- Useful if marshal made error
- Shows adjustment notification

---

## Implementation Priority Matrix

### High Value + Easy (Do First)
- Settings persistence
- Keyboard shortcuts
- Full screen mode
- Confirm restart dialog

### High Value + Medium (Do Next)
- Lap counter
- Race history
- PWA conversion
- Pause/resume

### High Value + Hard (Plan Carefully)
- Multi-racer tracking
- Spectator display
- Marshal mode sync

### Medium Value + Easy (Good Fillers)
- Custom race times
- Dark mode
- Timer adjustments
- Export data

### Medium Value + Medium
- Volume controls
- Visual enhancements
- Pre-race countdown
- Multiple race formats

### Low Priority
- Racer names (unless multi-racer tracking)
- Statistics dashboard
- Sound customization

---

## Notes

- Features marked with ⭐⭐⭐ are highest priority
- Consider user feedback before implementing complex features
- Focus on core racing functionality first
- PWA should be implemented early for better offline support
- Maintain mobile-first design philosophy

---

**Last Updated:** 2026-01-04
**Current Version:** v1.6.3
