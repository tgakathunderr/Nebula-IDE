import React from 'react';
import { ViewMode } from '../Workspace';

interface WorkspaceHeaderProps {
    openFiles: string[];
    activeFile: string | null;
    onTabClick: (path: string) => void;
    onTabClose: (path: string) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
    openFiles,
    activeFile,
    onTabClick,
    onTabClose,
    viewMode,
    setViewMode
}) => {
    return (
        <div className="workspace-tabs">
            <div className="view-controls">
                <div
                    onClick={() => setViewMode('FOLDER')}
                    className={`view-mode-button ${viewMode === 'FOLDER' ? 'active' : ''}`}
                    title="Toggle Explorer"
                >
                    📁
                </div>
                <div className="view-control-divider" />
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
            </div>

            <div className="tab-container">
                {openFiles.map(path => {
                    const name = path.split(/[/\\]/).pop();
                    const isActive = activeFile === path && viewMode !== 'FOLDER';
                    return (
                        <div
                            key={path}
                            className={`workspace-tab ${isActive ? 'active' : ''}`}
                            onClick={() => {
                                onTabClick(path);
                                if (viewMode === 'FOLDER') setViewMode('CODE');
                            }}
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
        </div>
    );
};
