import React, { useState, useEffect } from 'react';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';
import { WorkspaceContent } from './workspace/WorkspaceContent';
import { Breadcrumbs } from './Breadcrumbs';
import { FileExplorer } from './workspace/FileExplorer';

interface WorkspaceProps {
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
    onOpenFolder: () => void;
}

export type ViewMode = 'CODE' | 'PREVIEW' | 'FOLDER';

export const Workspace: React.FC<WorkspaceProps> = (props) => {
    const [viewMode, setViewMode] = useState<ViewMode>('CODE');
    const [previewUrl, setPreviewUrl] = useState('http://localhost:3000');

    useEffect(() => {
        if (props.previewRefreshKey > 0) {
            setViewMode('PREVIEW');
        }
    }, [props.previewRefreshKey]);

    return (
        <div className="workspace-container">
            <WorkspaceHeader
                openFiles={props.openFiles}
                activeFile={props.activeFile}
                onTabClick={props.onTabClick}
                onTabClose={props.onTabClose}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <div className="workspace-sub-header">
                <Breadcrumbs path={props.activeFile} />
            </div>

            <div className="workspace-view-content">
                {viewMode === 'FOLDER' ? (
                    <FileExplorer
                        files={props.files}
                        onFileClick={props.onFileClick}
                        activeFile={props.activeFile}
                        onOpenFolder={props.onOpenFolder}
                    />
                ) : (
                    <WorkspaceContent
                        viewMode={viewMode as 'CODE' | 'PREVIEW'}
                        activeFile={props.activeFile}
                        editorValue={props.editorValue}
                        onEditorChange={props.onEditorChange}
                        onSave={props.onSave}
                        previewUrl={previewUrl}
                        setPreviewUrl={setPreviewUrl}
                        previewRefreshKey={props.previewRefreshKey}
                    />
                )}
            </div>
        </div>
    );
};
