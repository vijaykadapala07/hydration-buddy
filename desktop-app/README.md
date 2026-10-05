# Hydration Buddy (desktop)

A little buddy who walks along the bottom of your screen every 2 hours, on top of whatever you're
using (browser, VS Code, a fullscreen video), and asks **"Had a glass of water yet?"**

- **Yes!** He cheers and jogs off to the right.
- **Not yet** He trudges back off to the left, a little sad.
- Either way he's gone, and the 2-hour countdown starts again.

He isn't a popup: there's no window, frame, or taskbar entry. He lives in a transparent strip at
the bottom of the screen that lets every click pass through to your apps, except on him and his
two buttons. He never takes keyboard focus, so you can keep typing while he walks in.

## Install on a Mac (prebuilt)
1. Download the zip for your Mac: `HydrationBuddy-1.0.4-mac-apple-silicon.zip` for M1/M2/M3/M4 Macs,
   `HydrationBuddy-1.0.4-mac-intel.zip` for older Intel Macs (Apple menu > About This Mac tells you which).
2. Double-click the zip, then drag **Hydration Buddy.app** into **Applications**.
3. The app isn't notarized by Apple, so the first launch needs one extra step:
   right-click the app > **Open** > **Open**. On macOS 15 or newer, if that only offers "Done", open
   **System Settings > Privacy & Security**, scroll down and click **Open Anyway**.
   (Terminal alternative: `xattr -cr "/Applications/Hydration Buddy.app"`, then open it normally.)
4. The buddy walks out straight away, and his face sits in your **Dock** (with a dot under it while
   he's running). Click the Dock icon any time to call him; right-click it for the menu (interval,
   pause, **Start when I log in**). There's also a small line-drawing of his face in the menu bar at
   the top right, but on MacBooks with a notch it can be hidden when the menu bar is crowded.

## Install on Windows (no setup needed)
1. Unzip `HydrationBuddy-1.0.3-windows.zip` anywhere (for example `C:\Users\<you>\Apps\Hydration Buddy`).
2. Double-click `Hydration Buddy.exe`. Windows SmartScreen may warn because the app isn't signed:
   click **More info**, then **Run anyway**.
3. A buddy face appears in the system tray (click the `^` near the clock if it's hidden).
   Right-click it and choose **Remind me now** to see him straight away, and tick
   **Start when I log in** so he comes back after a restart.

## Run from source (Windows, macOS, Linux)
Needs Node.js 18 or newer.
```bash
cd desktop-app
npm install
npm start            # runs in the tray; first reminder in 2 hours
npm run demo         # shows him immediately, then every 20 seconds after each answer
```

## Build your own installer
```bash
npm run dist:win     # .exe installer   (run on Windows)
npm run dist:mac     # .dmg             (run on a Mac)
npm run dist:linux   # .AppImage
```
Output lands in `dist/`.

## Keeping the buddy in sync with the web demo
`src/overlay.html` is generated from `../hydration-buddy.html` (the buddy's SVGs and CSS animations)
plus `src/overlay.template.html` (the desktop-only bits: full-width walk and the Yes/No buttons).
After changing the demo, run `npm run sync-buddy` (it also runs automatically before `npm start`),
then rebuild with `npm run dist:mac`.

## Tray menu
- Next reminder time and how many glasses you've said yes to today
- **Remind me now**
- **Remind me every** 30 min / 1 / 1.5 / 2 / 3 hours (saved between runs)
- **Pause reminders**
- **Start when I log in**
- **Quit**

## Behaviour details
- Appears on the monitor your mouse is on, standing on top of the taskbar/dock.
- If you've been away from the keyboard for 5+ minutes (or the screen is locked) when a reminder
  is due, he waits until you're back instead of talking to an empty room.
- Sleep/resume safe: the timer checks the clock every 15 s rather than relying on one long timeout.
- Launching the app a second time just calls him in now.
- Settings live in `settings.json` in the app's user-data folder.

## Files
- `src/main.js`: tray, timer, and the transparent overlay window.
- `src/overlay.html`: the buddy (same SVG, CSS animations and states as `../hydration-buddy.html`),
  with the Yes/No buttons added to his speech bubble.
- `src/buddy.js`: the `HydrationBuddy` controller plus desktop wiring (full-width walk, click-through).
- `test/smoke.js`: starts the app, calls the buddy, answers, and checks he leaves (`npm test yes|no`).

## Known limits
- Linux: works on X11. Under Wayland, always-on-top and click-through depend on the compositor.
- macOS: ad-hoc signed but not notarized, so the first launch needs the extra step above.
- The Windows build uses the default Electron icon on the .exe itself (the tray icon is the buddy).
