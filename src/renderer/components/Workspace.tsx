import React, { useState } from 'react';
import { Editor } from './Layout';
import { Terminal } from './Terminal';
import { Breadcrumbs } from './Breadcrumbs';

interface WorkspaceProps {
    activeFile: string | null;
    openFiles: string[];
    onTabClick: (path: string) => void;
    onTabClose: (path: string) => void;
    editorValue: string;
    onEditorChange: (val: string) => void;
    onSave: () => void;
}

type ViewMode = 'CODE' | 'PREVIEW' | 'SPLIT';

export const Workspace: React.FC<WorkspaceProps> = ({
    activeFile,
    openFiles,
    onTabClick,
    onTabClose,
    editorValue,
    onEditorChange,
    onSave
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('CODE');
    const [previewUrl, setPreviewUrl] = useState('http://localhost:3000');

    return (
        <div className="workspace-container">
            {/* File Tabs */}
            <div className="workspace-tabs">
                {openFiles.map(path => {
                    const name = path.split(/[/\\]/).pop();
                    const isActive = activeFile === path;
                    return (
                        <div
                            key={path}
                            className={`workspace-tab ${isActive ? 'active' : ''}`}
                            onClick={() => onTabClick(path)}
                        >
                            <span>{name}</span>
                            <span
                                className="close-icon"
                                onClick={(e) => { e.stopPropagation(); onTabClose(path); }}
                            >
                                ×
                            </span>
                        </div>
                    );
                })}

                {/* View Controls */}
                <div style={{ marginLeft: 'auto', display: 'flex', height: '100%', alignItems: 'center', gap: '8px', padding: '0 12px' }}>
                    {['Code', 'Preview', 'Split'].map(mode => (
                        <div
                            key={mode}
                            onClick={() => setViewMode(mode.toUpperCase() as ViewMode)}
                            style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                color: viewMode === mode.toUpperCase() ? 'var(--accent-primary)' : 'var(--text-muted)',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {mode}
                        </div>
                    ))}
                </div>
            </div>

            {/* Breadcrumbs */}
            <Breadcrumbs path={activeFile} />

            <div className="workspace-main">
                {/* Editor View */}
                {(viewMode === 'CODE' || viewMode === 'SPLIT') && (
                    <div style={{ flex: 1, display: 'flex', height: '100%' }}>
                        <Editor
                            activeFile={activeFile}
                            value={editorValue}
                            onChange={onEditorChange}
                            onSave={onSave}
                        />
                    </div>
                )}

                {/* Preview View */}
                {(viewMode === 'PREVIEW' || viewMode === 'SPLIT') && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#fff',
                        height: '100%',
                        borderLeft: viewMode === 'SPLIT' ? '1px solid var(--border-subtle)' : 'none'
                    }}>
                        <div className="panel-header" style={{
                            padding: '8px 16px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            background: 'var(--bg-secondary)',
                            borderBottom: '1px solid var(--border-subtle)'
                        }}>
                            <input
                                type="text"
                                value={previewUrl}
                                onChange={(e) => setPreviewUrl(e.target.value)}
                                className="nebula-input"
                                style={{ flex: 1, padding: '4px 12px', fontSize: '12px' }}
                            />
                            <button className="nebula-button" onClick={() => setPreviewUrl(prev => prev)}>Reload</button>
                        </div>
                        <iframe
                            src={previewUrl}
                            style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                            title="Preview"
                        />
                    </div>
                )}
            </div>

            {/* Terminal Zone */}
            <div className="terminal-zone">
                <div className="panel-header">
                    <span className="panel-title">Terminal</span>
                </div>
                <Terminal />
            </div>
        </div>
    );
};
