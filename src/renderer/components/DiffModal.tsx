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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(30px) saturate(200%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            color: '#fff',
            padding: '40px'
        }}>
            <div style={{
                backgroundColor: 'var(--nebula-bg-layered)',
                width: '95%',
                height: '90%',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                border: '1px solid var(--nebula-border)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid var(--border-medium)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-secondary)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Review Changes</h2>
                        <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px', opacity: 0.8 }}>
                            File: {filePath}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '24px',
                        lineHeight: 1
                    }}>×</button>
                </div>

                {/* Diff Content */}
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
                            padding: { top: 0, bottom: 0 },
                            renderOverviewRuler: false,
                            diffAlgorithm: 'advanced'
                        }}
                    />
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 32px',
                    borderTop: '1px solid var(--border-medium)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    background: 'var(--bg-secondary)'
                }}>
                    <button onClick={onClose} className="nebula-button">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="nebula-button nebula-button-primary">
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiffModal;
