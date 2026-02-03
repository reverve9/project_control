const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data)
})

contextBridge.exposeInMainWorld('electronAPI', {
  openStyleGuide: () => ipcRenderer.invoke('open-style-guide')
})
