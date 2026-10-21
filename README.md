# NOX Race

A complete mobile-friendly arcade racer made with HTML, CSS and JavaScript.
No npm installation, database, account login, API keys or external assets required.

## Vercel par deploy karne ke steps

1. ZIP download karke extract karo.
2. GitHub par ek NEW repository banao: `nox-race`.
3. Extracted folder ke ANDAR ki files GitHub par upload karo. Repository root par `index.html`, `style.css`, `game.js`, `icon.svg`, `vercel.json` aur `README.md` dikhne chahiye. ZIP file khud upload mat karna.
4. Vercel dashboard mein Add New > Project se yeh GitHub repository import karo.
5. Framework Preset: Other. Root Directory: repository root (default).
6. Build Command: Override enable karke field empty chhod do. Output Directory: Override enable karke `.` (single dot) rakho. Install Command: empty.
7. Deploy dabao. Deployment complete hone par Vercel ka URL open karo.

Agar repository ke andar poora `nox-race` folder upload kiya ho, Vercel mein Root Directory us folder par set karo.

## Play

- Desktop: left/right arrows or A/D to steer.
- Mobile: use the large left/right buttons, swipe on the road, or tap the left/right half of the road.
- P / Escape: pause or resume. Space: start, pause, resume or restart.
- Coins: +100 points. Distance: +1 point per metre.
- Traffic speeds up gradually. One collision ends the run.
- Sound is off by default. Use SOUND OFF/ON to toggle it.
- Switching tabs or windows pauses an active run.
- Best score is stored on the current browser/device when local storage is available. It is not a global leaderboard.

## Local play

Open `index.html` directly in a current browser, or run `python3 -m http.server 3000` in this folder and open http://localhost:3000.

## Customize

- Branding and text: `index.html`
- Colors and responsive layout: `style.css`
- Speed, traffic, points and gameplay: `game.js`
- Favicon: `icon.svg`

## Verification

JavaScript syntax, static file links and gameplay state transitions were checked with a Node-based simulated DOM/canvas. Real browser rendering, physical mobile touch/audio and an actual Vercel deployment were not verified in the build environment.

Made for Sameer / Addnox Tech.

## Lane-change vibration update

- The game title is now **NOX Race**.
- A short 25 ms vibration is requested only when a lane change actually happens during a run. Buttons, swipes, road taps and keyboard steering share the same logic.
- No vibration is requested for a blocked move at the road edge, before a run, or while paused. Pause/end cancels any remaining pulse.
- HAPTICS ON/OFF controls vibration; the choice is saved in this browser. It is independent of sound.
- Browsers without the Vibration API show HAPTICS N/A and continue playing normally. iPhone Safari does not support this web vibration API. Supported Android browsers can request it, but hardware, browser settings, Silent mode or Do Not Disturb may suppress feedback.
- The existing local high-score key is preserved.

Verification: simulated gameplay and haptics API checks passed. Actual phone vibration and a Vercel deployment have not been tested here.

Reference: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
