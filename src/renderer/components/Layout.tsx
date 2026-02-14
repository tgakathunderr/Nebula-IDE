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
        const isFolder = obj[name] !== null;
        const isActive = activeFile === currentPath;

        return (
          <div key={currentPath} style={{ paddingLeft: parentPath ? '12px' : '0' }}>
            <div
              onClick={() => !isFolder && onFileClick(currentPath)}
              className={`file-item ${activeFile?.replace(/\\/g, '/').endsWith(currentPath) ? 'active' : ''}`}
            >
              <span className={isFolder ? 'folder-icon' : `file-icon ${activeFile?.replace(/\\/g, '/').endsWith(currentPath) ? 'active' : ''}`}>
                {isFolder ? '󰉋' : (name.endsWith('.ts') || name.endsWith('.tsx') ? '󰛦' : '󰈙')}
              </span>
              <span className="file-label">
                {name}
              </span>
            </div>
            {isFolder && buildNodes(obj[name], currentPath)}
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {files.length === 0 ? (
          <div style={{ padding: '24px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
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
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', gap: '8px', zIndex: 10 }}>
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
  onFileChange: () => void;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({ activeFile, onFileChange }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ summary: string, changes: any[] } | null>(null);

  // Diff Modal State
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<any>(null);
  const [originalContent, setOriginalContent] = useState('');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const result = await window.electron.ai.prompt(prompt, activeFile);
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
      try {
        original = await window.electron.files.readFile(change.path);
      } catch (e) {
        // Assume file is being created if not found
      }
      setOriginalContent(original);
      setPendingChange(change);
      setIsDiffOpen(true);
    } catch (error) {
      console.error('Diff Load Error:', error);
      alert('Failed to load original content for comparison');
    }
  };

  const handleConfirmApply = async () => {
    if (!pendingChange) return;
    try {
      await window.electron.files.writeFile(pendingChange.path, pendingChange.content);
      onFileChange();
      setIsDiffOpen(false);
      setPendingChange(null);
      alert(`Successfully applied changes to ${pendingChange.path}`);
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
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
        >
          ⚙
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
        <textarea
          placeholder="I need help with..."
          className="nebula-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ width: '100%', height: '140px', resize: 'none' }}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="nebula-button nebula-button-primary"
          style={{ padding: '10px' }}
        >
          {loading ? 'Thinking...' : 'Generate Code'}
        </button>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!response && !loading && (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginTop: '40px' }}>
              Ask me anything about your code.
            </div>
          )}

          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accent-primary)', fontSize: '13px' }}>
              Processing request...
            </div>
          )}

          {response && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: '1.6',
                background: 'var(--bg-primary)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)'
              }}>
                {response.summary}
              </div>

              {response.changes.map((change: any, idx: number) => (
                <div key={idx} style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {change.path.split(/[/\\]/).pop()}
                  </span>
                  <button
                    onClick={() => openDiffReview(change)}
                    className="nebula-button"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
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
        onConfirm={handleConfirmApply}
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
