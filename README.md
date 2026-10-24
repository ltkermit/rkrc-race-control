# RKRC Race Control
A simple web based and mobile friendly racing timer.

[RKRC Race Control Website](https://control.rkrc.club/)

![race-example](https://github.com/user-attachments/assets/2bce6e5c-d551-44d3-95d3-420965432a23)

## Features
- Select race length from 1 to 10 minutes.
- Five announcer voices: American, European, NASCAR, Dee Liffy, and DJT.
- Race with or without a steward.
  - Without a steward: green flags are thrown after a random 3–6 second delay.
  - With a steward: green flags are thrown as soon as the steward clears the flag.
- Audible time remaining callouts at every minute and at 30 seconds.
- Practice mode (counts up, no race end condition).
- Screen stays on during a race (via NoSleep.js).
- Red flags pause the timer.
- Progressive Web App — installable on home screen, works offline.

## Mobile Compatibility
Audio is handled via the Web Audio API and works on iOS Safari, Chrome on Android, and all modern desktop browsers. No additional setup is required — tap Start Race and audio will play.

## Changelog
See [CHANGELOG.md](CHANGELOG.md) for full version history.

## Development
Code written with major assistance from Grok3 and Claude 4 AI.

As of version 1.6.1, development is assisted by [Claude Code](https://claude.com/claude-code).

Audio files created using Elevenlabs text to speech
- Arthur (America)
  - **Voice ID:** TtRFBnwQdH1k01vR0hMz
- Dexter (European)
  - **Voice ID:** oTQK6KgOJHp8UGGZjwUu
- Cowboy Chris (NASCAR)
  - **Voice ID:** o3VpiaQ9JcGIFpOrkHHf

[elevenlabs.io](https://elevenlabs.io/)