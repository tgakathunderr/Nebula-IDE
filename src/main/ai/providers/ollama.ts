import { AIContext, AIProvider, AIResponse } from '../types';

export class OllamaProvider implements AIProvider {
    id = 'ollama';
    name = 'Ollama';
    private readonly endpoint = 'http://localhost:11434/api/generate';
    private model = 'codellama';

    updateSettings(settings: any): void {
        if (settings.model) {
            this.model = settings.model;
        }
    }

    async generateResponse(prompt: string, context: AIContext): Promise<AIResponse> {
        const fullPrompt = this.buildFullPrompt(prompt, context);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: fullPrompt,
                    stream: false,
                    format: 'json',
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }

            const data = await response.json();
            return JSON.parse(data.response) as AIResponse;
        } catch (error) {
            console.error('Ollama Provider Error:', error);
            throw error;
        }
    }

    private buildFullPrompt(userPrompt: string, context: AIContext): string {
        const history = context.recentHistory
            .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
            .join('\n');

        const files = context.projectFiles.join(', ');
        const activeFile = context.activeFile
            ? `Active File: ${context.activeFile.path}\nContent:\n${context.activeFile.content}\n`
            : 'No active file.';

        const vibes = context.vibes ? `Vibes: ${JSON.stringify(context.vibes)}\n` : '';

        return `
You are Nebula AI, a world-class "vibecoding" assistant for fullstack web and python development.
Your goal is to build stunning, high-quality, and functional applications.
Follow this strict JSON format for your response:
{
  "summary": "Step-by-step explanation of the plan.",
  "changes": [
    {
      "path": "src/file.ts",
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
}

Context:
${activeFile}
Project Files: ${files}
${vibes}
Recent History:
${history}

User Instruction: ${userPrompt}

Respond ONLY with the JSON object. No commentary outside the JSON. No markdown backticks.
`;
    }
}
