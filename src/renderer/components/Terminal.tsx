import React, { useEffect, useState, useRef } from 'react';

interface TerminalProps {
    id: string;
    projectRoot: string | null;
}

export const Terminal: React.FC<TerminalProps> = ({ id, projectRoot }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [pendingCommand, setPendingCommand] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Start terminal session with specific ID
        const normalizedRoot = projectRoot?.replace(/\\/g, '/');
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

        return () => {
            window.electron.terminal.kill(id);
            // Note: In a real multi-terminal setup, we'd need to remove listeners, 
            // but the current Electron API doesn't expose a 'removeListener' yet.
            // I'll assume only one Terminal component instance per ID exists for now.
        }
    }, [id, projectRoot]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

    return (
        <div className="terminal-container">
            {/* Production Command Approval Modal */}
            {pendingCommand && (
                <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-container" style={{ width: '400px' }}>
                        <div className="panel-header">
                            <span className="panel-title">Security Warning</span>
                        </div>
                        <div className="modal-content">
                            <p style={{ fontSize: '13px', color: 'var(--text-default)' }}>
                                The AI wants to execute a command on your local system:
                            </p>
                            <code className="command-code" style={{ padding: '8px', display: 'block', wordBreak: 'break-all' }}>
                                {pendingCommand}
                            </code>
                            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px' }}>
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

            <div
                ref={scrollRef}
                className="terminal-content"
            >
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
