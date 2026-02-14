import { AIContext, AIProvider, AIResponse } from './types';

export class ProviderRegistry {
    private providers: Map<string, AIProvider> = new Map();
    private activeProviderId: string | null = null;

    register(provider: AIProvider) {
        this.providers.set(provider.id, provider);
        if (!this.activeProviderId) {
            this.activeProviderId = provider.id;
        }
    }

    getActiveProvider(): AIProvider | null {
        if (!this.activeProviderId) return null;
        return this.providers.get(this.activeProviderId) || null;
    }

    setActiveProvider(id: string) {
        if (this.providers.has(id)) {
            this.activeProviderId = id;
        }
    }
}
