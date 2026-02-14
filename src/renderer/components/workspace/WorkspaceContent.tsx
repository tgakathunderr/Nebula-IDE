import React from 'react';
import { EditorPanel } from '../panels/EditorPanel';
import { PreviewPanel } from '../panels/PreviewPanel';

interface WorkspaceContentProps {
    viewMode: 'CODE' | 'PREVIEW';
    activeFile: string | null;
    editorValue: string;
    onEditorChange: (value: string) => void;
    onSave: () => void;
    previewUrl: string;
    setPreviewUrl: (url: string) => void;
    previewRefreshKey: number;
}

export const WorkspaceContent: React.FC<WorkspaceContentProps> = ({
    viewMode,
    activeFile,
    editorValue,
    onEditorChange,
    onSave,
    previewUrl,
    setPreviewUrl,
    previewRefreshKey
}) => {
    return (
        <>
            {viewMode === 'CODE' ? (
                <div className="editor-panel">
                    <EditorPanel
                        activeFile={activeFile}
                        value={editorValue}
                        onChange={onEditorChange}
                        onSave={onSave}
                    />
                </div>
            ) : (
                <div className="preview-panel">
                    <PreviewPanel
                        previewUrl={previewUrl}
                        setPreviewUrl={setPreviewUrl}
                        previewRefreshKey={previewRefreshKey}
                    />
                </div>
            )}
        </>
    );
};
