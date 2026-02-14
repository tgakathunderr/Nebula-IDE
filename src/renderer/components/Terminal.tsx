import React, { useEffect, useState, useRef } from 'react';

export const Terminal: React.FC = () => {
    const [lines, setLines] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [pendingCommand, setPendingCommand] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Start terminal session
        window.electron.terminal.start('default');

        window.electron.terminal.onData((_id, data) => {
            setLines(prev => [...prev.slice(-500), data]);
        });

        window.electron.terminal.onExit((_id, code) => {
            setLines(prev => [...prev, `\r\n[Process exited with code ${code}]\r\n`]);
        });

        // Mock an AI suggestion for testing the Gate
        setTimeout(() => {
            setPendingCommand('npm start');
        }, 5000);

        return () => {
            window.electron.terminal.kill('default');
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines]);

    const handleInput = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            window.electron.terminal.write('default', input + '\n');
            setInput('');
        }
    };

    const handleApprove = () => {
        if (pendingCommand) {
            window.electron.terminal.write('default', pendingCommand + '\n');
            setPendingCommand(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', position: 'relative' }}>
            {/* Command Approval Gate */}
            {pendingCommand && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border-medium)',
                    padding: '8px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 10,
                    fontSize: '12px'
                }}>
                    <span>Execute command: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '3px', color: 'var(--accent-primary)' }}>{pendingCommand}</code>?</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setPendingCommand(null)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApprove}
                            className="nebula-button nebula-button-primary"
                            style={{ padding: '4px 12px' }}
                        >
                            Run Command
                        </button>
                    </div>
                </div>
            )}

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    padding: '16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: '#e4e4e7',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.4'
                }}
            >
                {lines.join('')}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ color: 'var(--accent-primary)', marginRight: '8px' }}>❯</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleInput}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            outline: 'none',
                            flex: 1,
                            fontFamily: 'inherit',
                            fontSize: 'inherit'
                        }}
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
};
