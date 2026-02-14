import React, { useState } from 'react';
import DiffModal from '../DiffModal';
import { SettingsModal } from '../SettingsModal';

interface AIPanelProps {
    activeFile: string | null;
    projectRoot: string | null;
    onFileChange: () => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({ activeFile, projectRoot, onFileChange }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<{ summary: string, changes: any[] } | null>(null);

    // Diff Modal State
    const [isDiffOpen, setIsDiffOpen] = useState(false);
    const [pendingChange, setPendingChange] = useState<any>(null);
    const [originalContent, setOriginalContent] = useState('');

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Helper to ensure path is absolute relative to projectRoot
    const resolvePath = (filePath: string) => {
        if (!projectRoot) return filePath;
        const normalizedProjectRoot = projectRoot.replace(/\\/g, '/');
        const normalizedFilePath = filePath.replace(/\\/g, '/');

        if (normalizedFilePath.startsWith(normalizedProjectRoot)) {
            return normalizedFilePath;
        }
        const cleanPath = normalizedFilePath.startsWith('/') ? normalizedFilePath.slice(1) : normalizedFilePath;
        return `${normalizedProjectRoot}/${cleanPath}`;
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || loading || !projectRoot) {
            if (!projectRoot) alert('Please open a folder first');
            return;
        }
        setLoading(true);
        try {
            const result = await window.electron.ai.prompt(prompt, activeFile, projectRoot);
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
            const fullPath = resolvePath(change.path);
            try {
                original = await window.electron.files.readFile(fullPath);
            } catch (e) {
                // Assume file is being created if not found
            }
            setOriginalContent(original);
            setPendingChange({ ...change, path: fullPath });
            setIsDiffOpen(true);
        } catch (error) {
            console.error('Diff Load Error:', error);
            alert('Failed to load original content for comparison');
        }
    };

    const handleConfirmApply = async (changeToApply: any) => {
        if (!changeToApply || !projectRoot) return;
        try {
            const fullPath = resolvePath(changeToApply.path);
            await window.electron.files.writeFile(fullPath, changeToApply.content);
            onFileChange();
            setIsDiffOpen(false);
            setPendingChange(null);
        } catch (error) {
            console.error('Apply Error:', error);
            alert('Failed to apply changes');
        }
    };

    return (
        <div className="prompt-panel">
            <div className="panel-header">
                <span className="panel-title">AI Assistant</span>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="icon-button"
                >
                    ⚙️
                </button>
            </div>

            <div className="prompt-content">
                <textarea
                    placeholder="Describe what you want to build..."
                    className="nebula-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={loading}
                    rows={4}
                />

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="nebula-button nebula-button-primary"
                >
                    {loading ? 'Thinking...' : 'Generate Intent'}
                </button>

                <div className="prompt-responses">
                    {!response && !loading && (
                        <div className="empty-state">
                            I can help you build and refine your project. Try asking for a layout or a specific feature.
                        </div>
                    )}

                    {loading && (
                        <div className="loading-state">
                            <span className="pulse">🧠</span> Thinking...
                        </div>
                    )}

                    {response && (
                        <div className="ai-response-container">
                            <div className="ai-summary glass-panel">
                                {response.summary}
                            </div>

                            <div className="ai-changes-list">
                                {response.changes.map((change: any, idx: number) => (
                                    <div key={idx} className="ai-change-item glass-panel">
                                        <div className="ai-change-info">
                                            <span className="file-icon">📄</span>
                                            <span className="file-path-badge">
                                                {change.path.split(/[/\\]/).pop()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => openDiffReview(change)}
                                            className="nebula-button-sm"
                                        >
                                            Review
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DiffModal
                isOpen={isDiffOpen}
                onClose={() => setIsDiffOpen(false)}
                onConfirm={() => handleConfirmApply(pendingChange)}
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
