import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AISettings } from './types';

export class SettingsManager {
    private readonly settingsPath: string;
    private settings: AISettings | null = null;

    constructor() {
        this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    }

    async loadSettings(): Promise<AISettings> {
        if (this.settings) return this.settings;

        try {
            const data = await fs.readFile(this.settingsPath, 'utf-8');
            this.settings = JSON.parse(data);
            return this.settings!;
        } catch (error) {
            // Default settings if file doesn't exist
            const defaults: AISettings = {
                activeProviderId: 'ollama',
                providers: {
                    ollama: { model: 'codellama' },
                    openai: { model: 'gpt-4-turbo-preview', apiKey: '' }
                }
            };
            await this.saveSettings(defaults);
            return defaults;
        }
    }

    async saveSettings(settings: AISettings): Promise<void> {
        this.settings = settings;
        try {
            await fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
}
