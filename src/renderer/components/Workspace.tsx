import React, { useState, useRef, useEffect } from 'react';
import { Editor } from './Layout';
import { Terminal } from './Terminal';
import { Breadcrumbs } from './Breadcrumbs';

interface WorkspaceProps {
    projectRoot: string | null;
    activeFile: string | null;
    openFiles: string[];
    onTabClick: (path: string) => void;
    onTabClose: (path: string) => void;
    editorValue: string;
    onEditorChange: (value: string) => void;
    onSave: () => void;
    isChatOpen: boolean;
    onToggleChat: () => void;
    previewRefreshKey: number;
}

type ViewMode = 'CODE' | 'PREVIEW';

export const Workspace: React.FC<WorkspaceProps> = ({
    projectRoot,
    activeFile,
    openFiles,
    onTabClick,
    onTabClose,
    editorValue,
    onEditorChange,
    onSave,
    isChatOpen,
    onToggleChat,
    previewRefreshKey
}) => {
    const initialTerminalId = `terminal-${Date.now()}`;
    const [terminals, setTerminals] = useState<string[]>([initialTerminalId]);
    const [activeTerminalId, setActiveTerminalId] = useState<string>(initialTerminalId);
    const [viewMode, setViewMode] = useState<ViewMode>('CODE');
    const [previewUrl, setPreviewUrl] = useState('http://localhost:3000');
    const [terminalHeight, setTerminalHeight] = useState(240);
    const isResizing = useRef(false);

    const addTerminal = () => {
        const newId = `terminal-${Date.now()}`;
        setTerminals(prev => [...prev, newId]);
        setActiveTerminalId(newId);
    };

    const removeTerminal = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (terminals.length === 1) return; // Keep at least one
        const newList = terminals.filter(t => t !== id);
        setTerminals(newList);
        if (activeTerminalId === id) {
            setActiveTerminalId(newList[newList.length - 1]);
        }
    };

    const startResizing = () => {
        isResizing.current = true;
        document.body.style.cursor = 'row-resize';
    };

    const stopResizing = () => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
    };

    const resize = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 100 && newHeight < window.innerHeight - 200) {
            setTerminalHeight(newHeight);
        }
    };

    useEffect(() => {
        if (previewRefreshKey > 0) {
            setViewMode('PREVIEW');
        }
    }, [previewRefreshKey]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, []);

    return (
        <div className="workspace-container">
            {/* File Tabs */}
            <div className="workspace-tabs">
                <div style={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
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
                </div>

                {/* View Mode Toggle */}
                <div className="view-controls">
                    <div
                        onClick={() => setViewMode('CODE')}
                        className={`view-mode-button ${viewMode === 'CODE' ? 'active' : ''}`}
                    >
                        Code
                    </div>
                    <div
                        onClick={() => setViewMode('PREVIEW')}
                        className={`view-mode-button ${viewMode === 'PREVIEW' ? 'active' : ''}`}
                    >
                        Preview
                    </div>

                    <button
                        className="icon-button"
                        onClick={onToggleChat}
                        title="Toggle AI Chat"
                        style={{ marginLeft: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '8px', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        {isChatOpen ? '󰄝' : '󰄞'}
                    </button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <Breadcrumbs path={activeFile} />

            <div className="workspace-main">
                {viewMode === 'CODE' ? (
                    <Editor
                        activeFile={activeFile}
                        value={editorValue}
                        onChange={onEditorChange}
                        onSave={onSave}
                    />
                ) : (
                    <div className="preview-container">
                        <div className="panel-header">
                            <input
                                type="text"
                                value={previewUrl}
                                onChange={(e) => setPreviewUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setPreviewUrl((e.target as HTMLInputElement).value)}
                                className="nebula-input"
                                style={{ flex: 1, height: '24px', fontSize: '11px' }}
                            />
                            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                <button
                                    className="nebula-button"
                                    onClick={() => {
                                        const url = previewUrl;
                                        setPreviewUrl('');
                                        setTimeout(() => setPreviewUrl(url), 10);
                                    }}
                                    title="Reload Preview"
                                >
                                    Reload
                                </button>
                                <button
                                    className="nebula-button"
                                    onClick={() => window.open(previewUrl, '_blank')}
                                    title="Open in Browser"
                                >
                                    ↗
                                </button>
                            </div>
                        </div>
                        <iframe
                            key={`${previewUrl}-${previewRefreshKey}`}
                            src={previewUrl}
                            style={{ flex: 1, border: 'none', width: '100%', background: 'transparent' }}
                            title="Preview"
                            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                        />
                    </div>
                )}
            </div>

            {/* Terminal Zone - Multi-terminal support */}
            <div className="terminal-zone" style={{ height: terminalHeight }}>
                <div
                    className="terminal-resizer"
                    onMouseDown={startResizing}
                />
                <div className="terminal-tabs">
                    <div style={{ display: 'flex', overflowX: 'auto', flex: 1, height: '100%' }}>
                        {terminals.map((id, index) => (
                            <div
                                key={id}
                                className={`terminal-tab ${activeTerminalId === id ? 'active' : ''}`}
                                onClick={() => setActiveTerminalId(id)}
                            >
                                <span>terminal {index + 1}</span>
                                {terminals.length > 1 && (
                                    <span
                                        className="close-icon"
                                        style={{ marginLeft: '4px' }}
                                        onClick={(e) => removeTerminal(id, e)}
                                    >
                                        ×
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="view-controls">
                        <button
                            className="icon-button"
                            onClick={addTerminal}
                            title="New Terminal"
                            style={{ padding: '0 12px', fontSize: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            +
                        </button>
                    </div>
                </div>
                {terminals.map(id => (
                    <div key={id} style={{ display: activeTerminalId === id ? 'contents' : 'none' }}>
                        <Terminal id={id} projectRoot={projectRoot} />
                    </div>
                ))}
            </div>
        </div>
    );
};
