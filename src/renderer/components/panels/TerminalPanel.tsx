import React, { useEffect, useState, useRef } from 'react';

interface TerminalPanelProps {
    id: string;
    projectRoot: string | null;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ id, projectRoot }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [pendingCommand, setPendingCommand] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Normalize root for consistent Windows/Unix behavior
        const normalizedRoot = projectRoot?.replace(/\\/g, '/');

        // Start terminal session with the project root explicitly
        window.electron.terminal.start(id, normalizedRoot || undefined);

        const dataListener = (dataId: string, data: string) => {
            if (dataId === id) {
                setLines(prev => [...prev.slice(-1000), data]);
            }
        };

        const exitListener = (dataId: string, code: number) => {
            if (dataId === id) {
                setLines(prev => [...prev, `\r\n[Process exited with code ${code}]\r\n`]);
            }
        };

        window.electron.terminal.onData(dataListener);
        window.electron.terminal.onExit(exitListener);

        // Lifecycle Guard: Ensure process is killed on unmount
        // This prevents orphan processes when switching tabs or closing panels
        return () => {
            window.electron.terminal.kill(id);
        };
    }, [id, projectRoot]);

    useEffect(() => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
            if (isAtBottom) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [lines]);

    const handleInput = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            window.electron.terminal.write(id, input + '\n');
            setInput('');
        }
    };

    const handleApprove = () => {
        if (pendingCommand) {
            window.electron.terminal.write(id, pendingCommand + '\n');
            setPendingCommand(null);
        }
    };

    const focusInput = () => {
        const inputEl = document.querySelector('.terminal-input') as HTMLInputElement;
        if (inputEl) inputEl.focus();
    };

    return (
        <div className="terminal-container" onClick={focusInput}>
            {pendingCommand && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="panel-header">
                            <span className="panel-title">Security Warning</span>
                        </div>
                        <div className="modal-content">
                            <p>The AI wants to execute a command on your local system:</p>
                            <code className="command-code">{pendingCommand}</code>
                            <p className="form-label" style={{ marginTop: 'var(--space-2)', textTransform: 'none' }}>
                                ⚠️ Running unverified commands can be dangerous. Only proceed if you trust this action.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setPendingCommand(null)} className="nebula-button">Reject</button>
                            <button onClick={handleApprove} className="nebula-button nebula-button-primary">Allow & Run</button>
                        </div>
                    </div>
                </div>
            )}

            <div ref={scrollRef} className="terminal-content">
                {lines.join('')}
                <div className="terminal-prompt-line">
                    <span className="terminal-prompt-icon">
                        {projectRoot ? projectRoot.split(/[/\\]/).pop() : 'nebula'} ❯
                    </span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleInput}
                        className="terminal-input"
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
};
