// Hydration Buddy: a tray app that sends a little buddy walking across the bottom of your
// screen every couple of hours to ask if you've had water. The buddy lives in a transparent,
// always-on-top, click-through strip, so whatever you're doing stays usable around him.

const { app, BrowserWindow, Tray, Menu, screen, ipcMain, powerMonitor, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const STRIP_HEIGHT = 380;          // px of screen the buddy (and his speech bubble) can use
const CHECK_EVERY_MS = 15 * 1000;  // how often we look at the clock (survives sleep/resume)
const AWAY_AFTER_S = 5 * 60;       // if you've been idle this long, wait until you're back
const INTERVALS = [30, 60, 90, 120, 180]; // minutes offered in the tray menu

const argv = process.argv.slice(1);
const flag = (name) => argv.find((a) => a.startsWith(`--${name}`));
const testIntervalS = Number((flag('interval-seconds') || '').split('=')[1]) || 0;

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

let tray = null;
let overlay = null;
let dueAt = 0;
let menuTimer = null;
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
let settings = { intervalMin: 120, paused: false, history: [] };

function loadSettings() {
  try { settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; } catch {}
}
function saveSettings() {
  try { fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
        fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2)); } catch {}
}
const intervalMs = () => (testIntervalS ? testIntervalS * 1000 : settings.intervalMin * 60 * 1000);
function scheduleNext() { dueAt = Date.now() + intervalMs(); refreshMenu(); }

// ---------- the overlay ----------
function showBuddy() {
  if (overlay) return;
  dueAt = 0;
  // Appear on whichever monitor the mouse is on, sitting just above the taskbar/dock.
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const wa = display.workArea;
  const height = Math.min(STRIP_HEIGHT, wa.height);
  const bounds = { x: wa.x, y: wa.y + wa.height - height, width: wa.width, height };

  overlay = new BrowserWindow({
    ...bounds,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,      // never steal the keyboard from your editor or browser
    alwaysOnTop: true,
    acceptFirstMouse: true, // macOS: the first click on Yes/No counts even though we aren't focused
    show: false,
    type: process.platform === 'darwin' ? 'panel' : (process.platform === 'linux' ? 'toolbar' : undefined),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');                     // above fullscreen apps too
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlay.setIgnoreMouseEvents(true, { forward: true });            // clicks fall through to your apps
  overlay.loadFile(path.join(__dirname, 'overlay.html'));
  overlay.once('ready-to-show', () => {
    overlay.showInactive();
    overlay.webContents.send('buddy:start', { platform: process.platform });
  });
  overlay.on('closed', () => { overlay = null; });
  refreshMenu();
}

// Renderer asks to catch clicks only while the pointer is over the buddy or his buttons.
ipcMain.on('buddy:interactive', (e, on) => {
  if (!overlay || e.sender !== overlay.webContents) return;
  if (on) overlay.setIgnoreMouseEvents(false);
  else overlay.setIgnoreMouseEvents(true, { forward: true });
});

// Linux can't forward mouse moves through an ignored window, so there we cut the window down
// to the buddy's own rectangle while he waits for an answer, and restore it when he walks off.
ipcMain.on('buddy:shape', (e, rect) => {
  if (!overlay || e.sender !== overlay.webContents || process.platform === 'darwin') return;
  const [w, h] = overlay.getSize();
  if (rect) {
    overlay.setShape([rect]);
    overlay.setIgnoreMouseEvents(false);
  } else {
    overlay.setShape([{ x: 0, y: 0, width: w, height: h }]);
    overlay.setIgnoreMouseEvents(true);
  }
});

ipcMain.on('buddy:answer', (e, answer) => {
  settings.history = [...(settings.history || []), { at: new Date().toISOString(), answer }].slice(-200);
  saveSettings();
  refreshMenu();
});

ipcMain.on('buddy:done', (e) => {
  if (overlay && e.sender === overlay.webContents) overlay.close();
  scheduleNext(); // the countdown restarts once he's gone
});

// ---------- timer ----------
function tick() {
  if (!dueAt || overlay || settings.paused) return;
  if (Date.now() < dueAt) return;
  const idle = powerMonitor.getSystemIdleState(AWAY_AFTER_S); // 'active' | 'idle' | 'locked' | 'unknown'
  if (idle === 'idle' || idle === 'locked') return;           // you're away; ask when you're back
  showBuddy();
}

// ---------- start at login ----------
const linuxAutostart = () => path.join(os.homedir(), '.config', 'autostart', 'hydration-buddy.desktop');
function getOpenAtLogin() {
  if (process.platform === 'linux') return fs.existsSync(linuxAutostart());
  return app.getLoginItemSettings().openAtLogin;
}
function setOpenAtLogin(on) {
  if (process.platform !== 'linux') { app.setLoginItemSettings({ openAtLogin: on, args: ['--hidden'] }); return; }
  const file = linuxAutostart();
  if (!on) { try { fs.unlinkSync(file); } catch {} return; }
  const exec = process.env.APPIMAGE || (app.isPackaged ? process.execPath : `${process.execPath} ${app.getAppPath()}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `[Desktop Entry]\nType=Application\nName=Hydration Buddy\nExec=${exec} --hidden\nX-GNOME-Autostart-enabled=true\n`);
}

// ---------- tray ----------
function nextLabel() {
  if (overlay) return 'Buddy is on screen now';
  if (settings.paused) return 'Reminders paused';
  if (!dueAt) return 'Waiting for you to come back';
  const mins = Math.max(0, Math.round((dueAt - Date.now()) / 60000));
  const at = new Date(dueAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `Next reminder at ${at} (in ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`})`;
}
function todayCount() {
  const today = new Date().toDateString();
  return (settings.history || []).filter((h) => h.answer === 'yes' && new Date(h.at).toDateString() === today).length;
}
function refreshMenu() {
  if (!tray) return;
  const label = (m) => (m % 60 ? `${m} minutes` : `${m / 60} hour${m === 60 ? '' : 's'}`);
  tray.setToolTip(`Hydration Buddy: ${nextLabel()}`);
  const items = [
    { label: nextLabel(), enabled: false },
    { label: `Glasses today: ${todayCount()}`, enabled: false },
    { type: 'separator' },
    { label: 'Remind me now', enabled: !overlay, click: showBuddy },
    { label: 'Remind me every', submenu: INTERVALS.map((m) => ({
        label: label(m), type: 'radio', checked: settings.intervalMin === m,
        click: () => { settings.intervalMin = m; saveSettings(); if (!overlay) scheduleNext(); },
      })) },
    { label: 'Pause reminders', type: 'checkbox', checked: !!settings.paused,
      click: (item) => { settings.paused = item.checked; saveSettings(); if (!item.checked) scheduleNext(); refreshMenu(); } },
    { label: 'Start when I log in', type: 'checkbox', checked: getOpenAtLogin(),
      click: (item) => setOpenAtLogin(item.checked) },
    { type: 'separator' },
    { label: 'Quit Hydration Buddy', click: () => app.quit() },
  ];
  tray.setContextMenu(Menu.buildFromTemplate(items));
  // macOS: the same menu on the Dock icon (right-click it), minus Quit which the Dock already has
  if (process.platform === 'darwin') app.dock.setMenu(Menu.buildFromTemplate(items.slice(0, -2)));
}

app.whenReady().then(() => {
  // macOS keeps its Dock icon (no LSUIElement) so the app is easy to find: clicking it calls the
  // buddy via 'activate' and right-clicking shows the menu. The menu bar icon can hide behind a notch.
  loadSettings();

  const iconFile = process.platform === 'darwin' ? 'trayTemplate.png' : 'tray.png';
  const icon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', iconFile));
  tray = new Tray(icon);
  tray.on('click', () => tray.popUpContextMenu());

  scheduleNext();
  setInterval(tick, CHECK_EVERY_MS);
  menuTimer = setInterval(refreshMenu, 60 * 1000);
  powerMonitor.on('resume', tick);
  powerMonitor.on('unlock-screen', tick);
  // Opening the app by hand sends him out once right away, so you can see it's running
  // (it has no window, only a tray / menu bar icon). Starting at login stays quiet.
  const atLogin = flag('hidden') || (process.platform === 'darwin' && app.getLoginItemSettings().wasOpenedAtLogin);
  if (flag('remind-now') || !atLogin) setTimeout(showBuddy, 1200);
});

app.on('second-instance', () => showBuddy()); // launching it again = "remind me now"
app.on('activate', () => { if (app.isReady() && tray) showBuddy(); }); // macOS: double-clicking it while it runs
app.on('window-all-closed', () => {}); // keep running in the tray after the buddy leaves
