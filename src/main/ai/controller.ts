import { MinimalContextBuilder } from './context';
import { ProviderRegistry } from './registry';
import { OllamaProvider } from './providers/ollama';
import { OpenAIProvider } from './providers/openai';
import { MockAIProvider } from './providers/mock';
import { AIResponse, AISettings } from './types';
import { SettingsManager } from './settings';
import { ipcMain } from 'electron';

export class AIController {
    private contextBuilder = new MinimalContextBuilder();
    private registry = new ProviderRegistry();
    private settingsManager = new SettingsManager();

    constructor() {
        this.registry.register(new OllamaProvider());
        this.registry.register(new OpenAIProvider());
        this.registry.register(new MockAIProvider());

        this.initSettings();
        this.registerIpc();
    }

    private async initSettings() {
        const settings = await this.settingsManager.loadSettings();
        this.applySettings(settings);
    }

    private applySettings(settings: AISettings) {
        this.registry.setActiveProvider(settings.activeProviderId);

        // Update each provider with its specific settings
        for (const [id, providerSettings] of Object.entries(settings.providers)) {
            const provider = (this.registry as any).providers.get(id); // Accessing private Map for bulk update
            if (provider && provider.updateSettings) {
                provider.updateSettings(providerSettings);
            }
        }
    }

    private registerIpc() {
        ipcMain.handle('ai-get-settings', async () => {
            return await this.settingsManager.loadSettings();
        });

        ipcMain.handle('ai-save-settings', async (_, settings: AISettings) => {
            await this.settingsManager.saveSettings(settings);
            this.applySettings(settings);
            return true;
        });
    }

    async handlePrompt(prompt: string, activeFilePath: string | null): Promise<AIResponse> {
        const provider = this.registry.getActiveProvider();
        if (!provider) {
            throw new Error('No AI provider available');
        }

        const context = await this.contextBuilder.buildContext(activeFilePath);

        // Add user prompt to history
        this.contextBuilder.addHistory('user', prompt);

        try {
            const response = await provider.generateResponse(prompt, context);

            // Add assistant response to history (summary part)
            this.contextBuilder.addHistory('assistant', response.summary);

            return response;
        } catch (error) {
            console.error('AI Provider Error:', error);
            throw error;
        }
    }
}
