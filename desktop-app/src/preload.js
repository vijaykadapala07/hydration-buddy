const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  onStart: (fn) => ipcRenderer.on('buddy:start', (_e, info) => fn(info)),
  setInteractive: (on) => ipcRenderer.send('buddy:interactive', !!on),
  setShape: (rect) => ipcRenderer.send('buddy:shape', rect),
  answer: (value) => ipcRenderer.send('buddy:answer', value),
  done: () => ipcRenderer.send('buddy:done'),
});
