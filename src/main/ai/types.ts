export interface AIChange {
    path: string;
    action: 'modify' | 'create' | 'delete';
    content: string;
}

export interface AIResponse {
    summary: string;
    changes: AIChange[];
}

export interface AIContext {
    activeFile?: {
        path: string;
        content: string;
    };
    projectFiles: string[];
    recentHistory: { role: 'user' | 'assistant'; content: string }[];
    vibes?: any;
}

export interface ProviderSettings {
    model: string;
    apiKey?: string;
}

export interface AISettings {
    activeProviderId: string;
    providers: {
        [id: string]: ProviderSettings;
    };
}

export interface AIProvider {
    id: string;
    name: string;
    updateSettings?(settings: ProviderSettings): void;
    generateResponse(prompt: string, context: AIContext): Promise<AIResponse>;
}
