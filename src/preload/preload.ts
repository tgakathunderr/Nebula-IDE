import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  process: {
    version: process.versions,
  },
  files: {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getFiles: (path: string) => ipcRenderer.invoke('get-files', path),
    readFile: (path: string) => ipcRenderer.invoke('read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  },
  ai: {
    prompt: (prompt: string, activeFilePath: string | null, projectRoot: string) => ipcRenderer.invoke('ai-prompt', prompt, activeFilePath, projectRoot),
    getSettings: () => ipcRenderer.invoke('ai-get-settings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('ai-save-settings', settings),
  },
  terminal: {
    start: (id: string, cwd?: string) => ipcRenderer.send('terminal-start', id, cwd),
    write: (id: string, data: string) => ipcRenderer.send('terminal-write', id, data),
    kill: (id: string) => ipcRenderer.send('terminal-kill', id),
    onData: (callback: (id: string, data: string) => void) => {
      ipcRenderer.on('terminal-data', (_event, id, data) => callback(id, data));
    },
    onExit: (callback: (id: string, code: number) => void) => {
      ipcRenderer.on('terminal-exit', (_event, id, code) => callback(id, code));
    }
  }
});
