import React from 'react';
import MonacoEditor from '@monaco-editor/react';

interface EditorPanelProps {
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    activeFile: string | null;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ value, onChange, onSave, activeFile }) => {
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
