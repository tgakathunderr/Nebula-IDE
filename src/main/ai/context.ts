import * as fs from 'fs/promises';
import * as path from 'path';
import { AIContext } from './types';

export class MinimalContextBuilder {
    private history: { role: 'user' | 'assistant'; content: string }[] = [];
    private readonly historyLimit = 15;

    addHistory(role: 'user' | 'assistant', content: string) {
        this.history.push({ role, content });
        if (this.history.length > this.historyLimit) {
            this.history.shift();
        }
    }

    async buildContext(activeFilePath: string | null, projectRoot: string): Promise<AIContext> {
        let activeFile = undefined;
        let vibes = undefined;

        if (activeFilePath) {
            try {
                const fullPath = path.isAbsolute(activeFilePath) ? activeFilePath : path.join(projectRoot, activeFilePath);
                const content = await fs.readFile(fullPath, 'utf-8');
                activeFile = {
                    path: activeFilePath,
                    content: content.slice(0, 10000) // Increased limit
                };
            } catch (error) {
                console.error('Failed to read active file for context:', error);
            }
        }

        // Try to read .vibe.json or package.json
        try {
            const packagePath = path.join(projectRoot, 'package.json');
            const pkgContent = await fs.readFile(packagePath, 'utf-8');
            vibes = JSON.parse(pkgContent);
        } catch {
            // Ignore if not found
        }

        // Get project structure
        const projectFiles = await this.getDeepFileList(projectRoot);

        return {
            activeFile,
            projectFiles,
            recentHistory: [...this.history],
            vibes
        };
    }

    private async getDeepFileList(root: string, currentDir: string = '', depth: number = 0): Promise<string[]> {
        if (depth > 3) return []; // Limit depth for performance

        try {
            const fullPath = path.join(root, currentDir);
            const dirents = await fs.readdir(fullPath, { withFileTypes: true });

            let files: string[] = [];
            for (const dirent of dirents) {
                const relPath = path.join(currentDir, dirent.name).replace(/\\/g, '/');

                if (dirent.isDirectory()) {
                    if (['node_modules', '.git', 'dist', 'dist-electron', 'build'].includes(dirent.name)) continue;
                    files.push(relPath + '/');
                    const subFiles = await this.getDeepFileList(root, relPath, depth + 1);
                    files = [...files, ...subFiles];
                } else {
                    files.push(relPath);
                }
            }
            return files;
        } catch {
            return [];
        }
    }
}
