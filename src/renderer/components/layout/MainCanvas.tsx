import React, { useState, useRef, useEffect } from 'react';
import { AIPanel } from './AIPanel';
import { Workspace } from '../Workspace';
import { TerminalPanel } from '../panels/TerminalPanel';

interface MainCanvasProps {
    files: string[];
    onFileClick: (file: string) => void;
    activeFile: string | null;
    projectRoot: string | null;
    openFiles: string[];
    onTabClick: (path: string) => void;
    onTabClose: (path: string) => void;
    editorValue: string;
    onEditorChange: (value: string) => void;
    onSave: () => void;
    previewRefreshKey: number;
    onCommandApprove: () => void;
    onOpenFolder: () => void;
}

export const MainCanvas: React.FC<MainCanvasProps> = (props) => {
    const [isChatOpen, setIsChatOpen] = useState(true);
    const initialTerminalId = `terminal-${Date.now()}`;
    const [terminals, setTerminals] = useState<string[]>([initialTerminalId]);
    const [activeTerminalId, setActiveTerminalId] = useState<string>(initialTerminalId);
    const [terminalHeight, setTerminalHeight] = useState(240);
    const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
    const isResizing = useRef(false);

    const addTerminal = () => {
        const newId = `terminal-${Date.now()}`;
        setTerminals(prev => [...prev, newId]);
        setActiveTerminalId(newId);
        setIsTerminalCollapsed(false);
    };

    const removeTerminal = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (terminals.length === 1) return;
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
        if (newHeight > 40 && newHeight < window.innerHeight - 200) {
            setTerminalHeight(newHeight);
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, []);

    return (
        <div className="main-canvas subtle-gradient">
            <div className="canvas-content">
                {isChatOpen && (
                    <div className="ai-panel-wrapper glass-panel">
                        <AIPanel
                            activeFile={props.activeFile}
                            projectRoot={props.projectRoot}
                            activeTerminalId={activeTerminalId}
                            onFileChange={props.onCommandApprove}
                        />
                    </div>
                )}

                <div className="workspace-area-wrapper glass-panel">
                    <Workspace
                        {...props}
                    />
                </div>
            </div>

            {/* Terminal Zone */}
            <div className={`terminal-zone glass-panel ${isTerminalCollapsed ? 'collapsed' : ''}`} style={{ height: isTerminalCollapsed ? '40px' : `${terminalHeight}px` }}>
                <div className="terminal-resizer" onMouseDown={startResizing} />
                <div className="terminal-header">
                    <div className="terminal-tabs">
                        {terminals.map((id, index) => (
                            <div
                                key={id}
                                className={`terminal-tab ${activeTerminalId === id ? 'active' : ''}`}
                                onClick={() => { setActiveTerminalId(id); setIsTerminalCollapsed(false); }}
                            >
                                <span>terminal {index + 1}</span>
                                {terminals.length > 1 && (
                                    <span className="close-icon" onClick={(e) => removeTerminal(id, e)}>×</span>
                                )}
                            </div>
                        ))}
                        <button className="icon-button" onClick={addTerminal}>+</button>
                    </div>
                    <div className="terminal-actions">
                        <button className="icon-button" onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}>
                            {isTerminalCollapsed ? '▲' : '▼'}
                        </button>
                    </div>
                </div>
                {!isTerminalCollapsed && (
                    <div className="terminal-content-wrapper">
                        {terminals.map(id => (
                            <div key={id} style={{ display: activeTerminalId === id ? 'contents' : 'none' }}>
                                <TerminalPanel id={id} projectRoot={props.projectRoot} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
