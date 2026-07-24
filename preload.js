// preload.js — Puente seguro entre el renderer y el proceso principal
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTemplate: () => ipcRenderer.invoke('get-template'),
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data)
});
