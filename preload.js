// preload - 只暴露必要的安全接口
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fishapi', {
  stats: () => ipcRenderer.invoke('stats:get'),
  resetStats: () => ipcRenderer.invoke('stats:reset')
});
