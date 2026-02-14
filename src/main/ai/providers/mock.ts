import { AIContext, AIProvider, AIResponse } from '../types';

export class MockAIProvider implements AIProvider {
    id = 'mock-ai';
    name = 'Mock AI';

    async generateResponse(prompt: string, context: AIContext): Promise<AIResponse> {
        // Mocking the structured response format
        return {
            summary: `I've analyzed your request: "${prompt}". In this mock mode, I'll propose a small change.`,
            changes: [
                {
                    path: context.activeFile?.path || 'new-file.txt',
                    action: 'modify',
                    content: `${context.activeFile?.content || ''}\n\n// Added by Mock AI`
                }
            ]
        };
    }
}
