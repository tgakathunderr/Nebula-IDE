import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import DiffModal from './DiffModal';
import { SettingsModal } from './SettingsModal';

interface FileTreeProps {
  files: string[];
  onFileClick: (file: string) => void;
  activeFile: string | null;
  onOpenFolder: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onFileClick, activeFile, onOpenFolder }) => {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderTree = (fileList: string[]) => {
    const tree: any = {};
    fileList.forEach(path => {
      const parts = path.split(/[/\\]/);
      let current = tree;
      parts.forEach((part, i) => {
        if (!current[part]) {
          current[part] = i === parts.length - 1 ? null : {};
        }
        current = current[part];
      });
    });

    const buildNodes = (obj: any, parentPath = '') => {
      return Object.keys(obj).sort((a, b) => {
        if (obj[a] !== null && obj[b] === null) return -1;
        if (obj[a] === null && obj[b] !== null) return 1;
        return a.localeCompare(b);
      }).map(name => {
        const currentPath = parentPath ? `${parentPath}/${name}` : name;
        const normalizedCurrentPath = currentPath.replace(/\\/g, '/');
        const isFolder = obj[name] !== null;
        const isExpanded = expandedFolders.has(normalizedCurrentPath);
        const isActive = activeFile?.replace(/\\/g, '/').endsWith(normalizedCurrentPath);

        return (
          <div key={normalizedCurrentPath} style={{ paddingLeft: parentPath ? '12px' : '0' }}>
            <div
              onClick={() => isFolder ? toggleFolder(normalizedCurrentPath) : onFileClick(normalizedCurrentPath)}
              className={`file-item ${isActive ? 'active' : ''}`}
            >
              <span className="expansion-icon" style={{ width: '16px', display: 'inline-block', fontSize: '10px', color: 'var(--text-muted)' }}>
                {isFolder ? (isExpanded ? '▼' : '▶') : ''}
              </span>
              <span className={isFolder ? 'folder-icon' : `file-icon ${isActive ? 'active' : ''}`}>
                {isFolder ? '󰉋' : (name.endsWith('.ts') || name.endsWith('.tsx') ? '󰛦' : '󰈙')}
              </span>
              <span className="file-label">
                {name}
              </span>
            </div>
            {isFolder && isExpanded && buildNodes(obj[name], normalizedCurrentPath)}
          </div>
        );
      });
    };

    return buildNodes(tree);
  };

  return (
    <div className="file-tree">
      <div className="panel-header">
        <span className="panel-title">Explorer</span>
        <button onClick={onOpenFolder} className="nebula-button">
          Open Folder
        </button>
      </div>
      <div className="file-tree-content">
        {files.length === 0 ? (
          <div className="empty-state">
            No folder opened.
          </div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
};

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  activeFile: string | null;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, onSave, activeFile }) => {
  return (
    <div className="editor-container">
      <MonacoEditor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          lineHeight: 22,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          fontLigatures: true,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden'
          }
        }}
      />
      {activeFile && (
        <div className="editor-actions">
          <button onClick={onSave} className="nebula-button nebula-button-primary">
            Save
          </button>
        </div>
      )}
    </div>
  );
};

interface PromptPanelProps {
  activeFile: string | null;
  projectRoot: string | null;
  onFileChange: () => void;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({ activeFile, projectRoot, onFileChange }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ summary: string, changes: any[] } | null>(null);

  // Diff Modal State
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<any>(null);
  const [originalContent, setOriginalContent] = useState('');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Helper to ensure path is absolute relative to projectRoot
  const resolvePath = (filePath: string) => {
    if (!projectRoot) return filePath;
    const normalizedProjectRoot = projectRoot.replace(/\\/g, '/');
    const normalizedFilePath = filePath.replace(/\\/g, '/');

    if (normalizedFilePath.startsWith(normalizedProjectRoot)) {
      return normalizedFilePath;
    }
    const cleanPath = normalizedFilePath.startsWith('/') ? normalizedFilePath.slice(1) : normalizedFilePath;
    return `${normalizedProjectRoot}/${cleanPath}`;
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading || !projectRoot) {
      if (!projectRoot) alert('Please open a folder first');
      return;
    }
    setLoading(true);
    try {
      const result = await window.electron.ai.prompt(prompt, activeFile, projectRoot);
      setResponse(result);
    } catch (error) {
      console.error('AI Error:', error);
      alert('Failed to generate response');
    } finally {
      setLoading(false);
    }
  };

  const openDiffReview = async (change: any) => {
    try {
      let original = '';
      const fullPath = resolvePath(change.path);
      try {
        original = await window.electron.files.readFile(fullPath);
      } catch (e) {
        // Assume file is being created if not found
      }
      setOriginalContent(original);
      setPendingChange({ ...change, path: fullPath });
      setIsDiffOpen(true);
    } catch (error) {
      console.error('Diff Load Error:', error);
      alert('Failed to load original content for comparison');
    }
  };

  const handleConfirmApply = async (changeToApply: any) => {
    if (!changeToApply || !projectRoot) return;
    try {
      const fullPath = resolvePath(changeToApply.path);
      await window.electron.files.writeFile(fullPath, changeToApply.content);
      onFileChange();
      setIsDiffOpen(false);
      setPendingChange(null);
    } catch (error) {
      console.error('Apply Error:', error);
      alert('Failed to apply changes');
    }
  };

  return (
    <div className="prompt-panel">
      <div className="panel-header">
        <span className="panel-title">AI Chat</span>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="icon-button"
        >
          ⚙
        </button>
      </div>

      <div className="prompt-content">
        <textarea
          placeholder="I need help with..."
          className="nebula-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          rows={5}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="nebula-button nebula-button-primary"
        >
          {loading ? 'Thinking...' : 'Generate Code'}
        </button>

        <div className="prompt-responses">
          {!response && !loading && (
            <div className="empty-state">
              Ask me anything about your code.
            </div>
          )}

          {loading && (
            <div className="loading-state">
              Processing request...
            </div>
          )}

          {response && (
            <div className="ai-response-container">
              <div className="ai-summary">
                {response.summary}
              </div>

              {response.changes.map((change: any, idx: number) => (
                <div key={idx} className="ai-change-item">
                  <span className="file-path-badge">
                    {change.path.split(/[/\\]/).pop()}
                  </span>
                  <button
                    onClick={() => openDiffReview(change)}
                    className="nebula-button"
                  >
                    View Diff
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        onConfirm={() => handleConfirmApply(pendingChange)}
        originalContent={originalContent}
        proposedContent={pendingChange?.content || ''}
        filePath={pendingChange?.path || ''}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
