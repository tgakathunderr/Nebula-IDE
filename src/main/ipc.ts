import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AIController } from './ai/controller';

const aiController = new AIController();

export function registerIpcHandlers() {
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('ai-prompt', async (_, prompt: string, activeFilePath: string | null) => {
    return await aiController.handlePrompt(prompt, activeFilePath);
  });

  ipcMain.handle('get-files', async (_, dirPath: string) => {
    try {
      const getFilesRecursively = async (dir: string): Promise<string[]> => {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(dirents.map((dirent) => {
          const res = path.resolve(dir, dirent.name);
          const relativePath = path.relative(dirPath, res);

          if (dirent.isDirectory()) {
            if (dirent.name === 'node_modules' || dirent.name === '.git' || dirent.name === 'dist' || dirent.name === 'dist-electron') {
              return [];
            }
            return getFilesRecursively(res);
          }
          return [relativePath];
        }));
        return Array.prototype.concat(...files);
      };

      const allFiles = await getFilesRecursively(dirPath);
      return allFiles.map(f => f.replace(/\\/g, '/')); // Normalize to forward slashes
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      throw error;
    }
  });

  ipcMain.handle('read-file', async (_, filePath: string) => {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  });

  ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  });

  // Terminal Handlers
  ipcMain.on('terminal-start', (event, id: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (!(win as any).terminalManager) {
      // This will be handled in main.ts to inject the manager
    }
    (win as any).terminalManager?.startTerminal(id);
  });

  ipcMain.on('terminal-write', (event, id: string, data: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    (win as any).terminalManager?.write(id, data);
  });

  ipcMain.on('terminal-kill', (event, id: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    (win as any).terminalManager?.kill(id);
  });
}
