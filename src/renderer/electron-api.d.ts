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

export interface IElectronAPI {
  process: {
    version: NodeJS.ProcessVersions;
  };
  files: {
    selectFolder: () => Promise<string | null>;
    getFiles: (path: string) => Promise<string[]>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<boolean>;
  };
  ai: {
    prompt: (prompt: string, activeFilePath: string | null, projectRoot: string) => Promise<{
      summary: string;
      changes: Array<{
        path: string;
        action: 'modify' | 'create' | 'delete';
        content: string;
      }>;
      commands?: Array<{
        command: string;
        description: string;
      }>;
    }>;
    getSettings: () => Promise<AISettings>;
    saveSettings: (settings: AISettings) => Promise<boolean>;
  };
  terminal: {
    start: (id: string, cwd?: string) => void;
    write: (id: string, data: string) => void;
    kill: (id: string) => void;
    onData: (callback: (id: string, data: string) => void) => void;
    onExit: (callback: (id: string, code: number) => void) => void;
  };
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
