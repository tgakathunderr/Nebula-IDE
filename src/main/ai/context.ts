import * as fs from 'fs/promises';
import * as path from 'path';
import { AIContext } from './types';

export class MinimalContextBuilder {
    private history: { role: 'user' | 'assistant'; content: string }[] = [];
    private readonly historyLimit = 10;

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
                    content: content.slice(0, 5000)
                };
            } catch (error) {
                console.error('Failed to read active file for context:', error);
            }
        }

        // Try to read .vibe.json in the project root
        try {
            const vibePath = path.join(projectRoot, '.vibe.json');
            const vibeContent = await fs.readFile(vibePath, 'utf-8');
            vibes = JSON.parse(vibeContent);
        } catch {
            // Ignore if not found or invalid
        }

        // Get project files from the guest root
        const projectFiles = await this.getQuickFileList(projectRoot);

        return {
            activeFile,
            projectFiles,
            recentHistory: [...this.history],
            vibes
        };
    }

    private async getQuickFileList(projectRoot: string): Promise<string[]> {
        try {
            const dirents = await fs.readdir(projectRoot, { withFileTypes: true });
            return dirents
                .filter(d => !d.isDirectory() || !['node_modules', '.git', 'dist', 'dist-electron'].includes(d.name))
                .map(d => d.name)
                .sort();
        } catch {
            return [];
        }
    }
}
