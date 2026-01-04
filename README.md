# RKRC Race Control
A simple web based and mobile friendly racing timer.

[RKRC Race Control Website](https://control.rkrc.club/)

![race-example](https://github.com/user-attachments/assets/2bce6e5c-d551-44d3-95d3-420965432a23)

## Features:
- Select race length from 1 to 10 minutes.
- Three different announcer voices.
- Race with or without a steward.
  - When racing without a steward, green flags are randomly thrown after clearing a flag.
  - When racing with a steward, green flags are thrown as soon the steward clears a flag.
- Audible time remaing callouts at every minute and the last 30 seconds.
- Practice mode can be enabled to disable the countdown.
- While a race is running your mobile screen will remain on.
- Red flags pause the timer.

## Apple iOS:
As of version 1.6.3, audio should work reliably on iOS/Safari using Web Audio API buffers. However, if you experience any audio issues, Firefox is recommended as an alternative browser on Apple devices.

[Firefox on the Apple App Store](https://apps.apple.com/us/app/firefox-private-web-browser/id989804926)

If you continue to experience audio problems, please open an issue on GitHub.

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