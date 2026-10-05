// Smoke test: start the real app, trigger the buddy, capture frames, answer, and check he leaves.
// Run: npx electron test/smoke.js [yes|no]
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const answer = process.argv.find((a) => a === 'yes' || a === 'no') || 'yes';
const outDir = path.join(__dirname, 'frames');
fs.mkdirSync(outDir, { recursive: true });
process.argv.push('--remind-now');
require('../src/main.js');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.on('browser-window-created', async (_e, win) => {
  const snap = async (name) => {
    const img = await win.capturePage();
    fs.writeFileSync(path.join(outDir, `${answer}-${name}.png`), img.toPNG());
    const state = await win.webContents.executeJavaScript('document.getElementById("buddy").dataset.state');
    console.log(name, 'state =', state, 'bounds =', JSON.stringify(win.getBounds()));
  };
  await new Promise((r) => win.webContents.once('did-finish-load', r));
  await wait(1500); await snap('1-walking-in');
  await wait(5000); await snap('2-asking');
  await wait(4000); await snap('2b-no-answer-nudge');
  await win.webContents.executeJavaScript(`document.getElementById("btn-${answer}").click()`);
  await wait(800); await snap('3-leaving');
  win.on('closed', () => { console.log('overlay closed; timer reset'); setTimeout(() => app.exit(0), 300); });
  setTimeout(() => { console.log('FAIL: overlay never closed'); app.exit(1); }, 20000);
});
