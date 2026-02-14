import React, { useState } from 'react';
import DiffModal from '../DiffModal';
import { SettingsModal } from '../SettingsModal';

interface AIPanelProps {
    activeFile: string | null;
    projectRoot: string | null;
    activeTerminalId: string;
    onFileChange: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    response?: {
        summary: string,
        changes: any[],
        commands?: any[]
    };
}

export const AIPanel: React.FC<AIPanelProps> = ({ activeFile, projectRoot, activeTerminalId, onFileChange }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [lastResponse, setLastResponse] = useState<any>(null); // For "Apply All" to reference latest
    const chatEndRef = React.useRef<HTMLDivElement>(null);

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

    React.useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const handleGenerate = async () => {
        if (!prompt.trim() || loading || !projectRoot) {
            if (!projectRoot) alert('Please open a folder first');
            return;
        }

        const userMsg: Message = { role: 'user', content: prompt };
        setMessages(prev => [...prev, userMsg]);
        const currentPrompt = prompt;
        setPrompt('');
        setLoading(true);

        try {
            const result = await window.electron.ai.prompt(currentPrompt, activeFile, projectRoot);
            const assistantMsg: Message = {
                role: 'assistant',
                content: result.summary,
                response: result
            };
            setMessages(prev => [...prev, assistantMsg]);
            setLastResponse(result);
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

    const handleApplyAll = async () => {
        if (!lastResponse || !lastResponse.changes || !projectRoot) return;
        setLoading(true);
        try {
            for (const change of lastResponse.changes) {
                const fullPath = resolvePath(change.path);
                await window.electron.files.writeFile(fullPath, change.content);
            }
            onFileChange();
            alert(`Applied ${lastResponse.changes.length} changes successfully`);
            setLastResponse(null); // Clear last response after successful apply all
        } catch (error) {
            console.error('Apply All Error:', error);
            alert('Failed to apply some changes');
        } finally {
            setLoading(false);
        }
    };

    const handleRunCommand = (command: string) => {
        if (!activeTerminalId) {
            alert('No active terminal found');
            return;
        }
        window.electron.terminal.write(activeTerminalId, command + '\n');
    };

    return (
        <div className="prompt-panel">
            <div className="panel-header">
                <span className="panel-title">Nebula AI</span>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="icon-button"
                    title="Settings"
                >
                    ⚙️
                </button>
            </div>

            <div className="prompt-content">
                <div className="nebula-input-wrapper">
                    <textarea
                        placeholder="What are we building today?"
                        className="nebula-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                        disabled={loading}
                        rows={3}
                    />
                    <div className="input-actions">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="nebula-button nebula-button-primary"
                        >
                            {loading ? 'Thinking...' : 'Generate'}
                        </button>
                    </div>
                </div>

                <div className="prompt-responses">
                    {messages.length === 0 && !loading && (
                        <div className="empty-state">
                            <p>Ask me to create a feature, fix a bug, or refactor code.</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.role}`}>
                            <div className="message-content">
                                {msg.role === 'user' ? (
                                    <div className="user-prompt-text">{msg.content}</div>
                                ) : (
                                    <div className="ai-response-container">
                                        <div className="ai-summary">
                                            {msg.content}
                                        </div>

                                        {msg.response && (
                                            <>
                                                {msg.response.changes && msg.response.changes.length > 0 && (
                                                    <div className="ai-section">
                                                        <div className="section-header">
                                                            <div className="section-label">Suggested Fixes</div>
                                                            {msg.response.changes.length > 1 && (
                                                                <button
                                                                    onClick={handleApplyAll}
                                                                    className="nebula-button nebula-button-primary"
                                                                    title="Apply all suggested changes at once"
                                                                >
                                                                    Apply All
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="ai-changes-list">
                                                            {msg.response.changes.map((change: any, cIdx: number) => (
                                                                <div key={cIdx} className="ai-change-item">
                                                                    <div className="ai-change-info">
                                                                        <span className="file-icon">📄</span>
                                                                        <span className="file-path-badge">
                                                                            {change.path.split(/[/\\]/).pop()}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => openDiffReview(change)}
                                                                        className="nebula-button"
                                                                    >
                                                                        Review
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {msg.response.commands && msg.response.commands.length > 0 && (
                                                    <div className="ai-section">
                                                        <div className="section-label">Terminal Commands</div>
                                                        <div className="ai-commands-list">
                                                            {msg.response.commands.map((cmd: any, cmdIdx: number) => (
                                                                <div key={cmdIdx} className="ai-command-item">
                                                                    <div className="ai-command-info">
                                                                        <span className="command-text">{cmd.command}</span>
                                                                        <span className="command-desc">{cmd.description}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleRunCommand(cmd.command)}
                                                                        className="nebula-button nebula-button-primary"
                                                                    >
                                                                        Run
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="loading-state">
                            <span className="pulse">🧠</span>
                            <p>Architecting solution...</p>
                        </div>
                    )}
                    <div ref={chatEndRef} />
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
