import React from 'react';
import { DiffEditor } from '@monaco-editor/react';

interface DiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    originalContent: string;
    proposedContent: string;
    filePath: string;
}

const DiffModal: React.FC<DiffModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    originalContent,
    proposedContent,
    filePath
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container" style={{ width: '90vw', height: '90vh' }}>
                <div className="panel-header">
                    <div>
                        <span className="panel-title">Review Changes</span>
                        <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>
                            {filePath}
                        </div>
                    </div>
                    <button onClick={onClose} className="icon-button" style={{ fontSize: '24px' }}>×</button>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <DiffEditor
                        original={originalContent}
                        modified={proposedContent}
                        language="javascript"
                        theme="vs-dark"
                        options={{
                            readOnly: true,
                            renderSideBySide: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', monospace",
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            padding: { top: 12, bottom: 12 },
                            renderOverviewRuler: false,
                        }}
                    />
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="nebula-button">Cancel</button>
                    <button onClick={onConfirm} className="nebula-button nebula-button-primary">
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiffModal;
