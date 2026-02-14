import { AIContext, AIProvider, AIResponse } from '../types';

export class OpenAIProvider implements AIProvider {
    id = 'openai';
    name = 'OpenAI';
    private readonly endpoint = 'https://api.openai.com/v1/chat/completions';
    private model = 'gpt-4-turbo-preview';
    private apiKey = '';

    updateSettings(settings: any): void {
        if (settings.model) this.model = settings.model;
        if (settings.apiKey) this.apiKey = settings.apiKey;
    }

    async generateResponse(prompt: string, context: AIContext): Promise<AIResponse> {
        const apiKey = this.apiKey || process.env.OPENAI_API_KEY || '';
        if (!apiKey) throw new Error('OpenAI API Key is missing. Please check settings.');

        const messages = [
            {
                role: 'system',
                content: `You are Nebula AI, a world-class "vibecoding" assistant for fullstack web and python development.
Your goal is to build stunning, high-quality, and functional applications.
Adhere to premium design principles: Glassmorphism, smooth animations, harmonious color palettes, and modern typography.

Always respond with a detailed summary of your plan followed by the technical changes.
Follow this strict JSON format. No commentary outside the JSON.

{
  "summary": "Step-by-step explanation of the plan.",
  "changes": [
    {
      "path": "src/components/Header.tsx",
      "action": "modify",
      "content": "Full file content here..."
    }
  ],
  "commands": [
    {
      "command": "npm install framer-motion",
      "description": "Install animation library"
    }
  ]
}`
            },
            ...context.recentHistory.map(h => ({
                role: h.role,
                content: h.content
            })),
            {
                role: 'user',
                content: this.buildUserContent(prompt, context)
            }
        ];

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.2,
                    response_format: { type: 'json_object' }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI error: ${response.statusText} ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            return JSON.parse(content) as AIResponse;
        } catch (error) {
            console.error('OpenAI Provider Error:', error);
            throw error;
        }
    }

    private buildUserContent(userPrompt: string, context: AIContext): string {
        const files = context.projectFiles.join(', ');
        const activeFile = context.activeFile
            ? `Active File: ${context.activeFile.path}\nContent:\n${context.activeFile.content}\n`
            : 'No active file.';
        const vibes = context.vibes ? `Vibes: ${JSON.stringify(context.vibes)}\n` : '';

        return `
Context:
${activeFile}
Project Files: ${files}
${vibes}

User Instruction: ${userPrompt}
`;
    }
}
