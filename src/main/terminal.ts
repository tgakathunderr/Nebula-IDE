import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { BrowserWindow } from 'electron';

export class TerminalManager {
    private processes: Map<string, ChildProcessWithoutNullStreams> = new Map();

    constructor(private mainWindow: BrowserWindow) { }

    startTerminal(id: string, cwd: string = process.cwd()) {
        if (this.processes.has(id)) return;

        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
        const p = spawn(shell, [], {
            cwd: cwd,
            env: process.env
        });

        p.stdout.on('data', (data) => {
            this.mainWindow.webContents.send('terminal-data', id, data.toString());
        });

        p.stderr.on('data', (data) => {
            this.mainWindow.webContents.send('terminal-data', id, data.toString());
        });

        p.on('exit', (code) => {
            this.mainWindow.webContents.send('terminal-exit', id, code);
            this.processes.delete(id);
        });

        this.processes.set(id, p);
    }

    write(id: string, data: string) {
        const p = this.processes.get(id);
        if (p) {
            p.stdin.write(data);
        }
    }

    kill(id: string) {
        const p = this.processes.get(id);
        if (p) {
            p.kill();
            this.processes.delete(id);
        }
    }
}
