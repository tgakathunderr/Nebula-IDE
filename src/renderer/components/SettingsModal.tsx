import React, { useState, useEffect } from 'react';
import { AISettings } from '../electron-api';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState<AISettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            window.electron.ai.getSettings().then((s: AISettings) => {
                setSettings(s);
                setLoading(false);
            });
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!settings) return;
        await window.electron.ai.saveSettings(settings);
        alert('Settings saved successfully');
        onClose();
    };

    if (!isOpen || !settings) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                width: '500px',
                borderRadius: '12px',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden'
            }}>
                <div className="panel-header">
                    <span className="panel-title">AI Settings</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Active Provider */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Active Model Provider</label>
                        <select
                            value={settings.activeProviderId}
                            onChange={(e) => setSettings({ ...settings, activeProviderId: e.target.value })}
                            className="nebula-input"
                            style={{ width: '100%' }}
                        >
                            <option value="openai">OpenAI (GPT-4o)</option>
                            <option value="ollama">Ollama (Local Models)</option>
                            <option value="mock-ai">Mock AI (Offline)</option>
                        </select>
                    </div>

                    {/* Provider Settings */}
                    <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {settings.activeProviderId === 'openai' ? 'OpenAI Configuration' : 'Local Node Settings'}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Model Name</label>
                                <input
                                    type="text"
                                    value={settings.providers[settings.activeProviderId].model}
                                    onChange={(e) => {
                                        const updated = { ...settings };
                                        updated.providers[settings.activeProviderId].model = e.target.value;
                                        setSettings(updated);
                                    }}
                                    className="nebula-input"
                                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                                />
                            </div>

                            {settings.activeProviderId === 'openai' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>API Key</label>
                                    <input
                                        type="password"
                                        placeholder="sk-..."
                                        value={settings.providers.openai.apiKey || ''}
                                        onChange={(e) => {
                                            const updated = { ...settings };
                                            updated.providers.openai.apiKey = e.target.value;
                                            setSettings(updated);
                                        }}
                                        className="nebula-input"
                                        style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    padding: '20px 24px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    background: 'rgba(0,0,0,0.1)'
                }}>
                    <button onClick={onClose} className="nebula-button">Cancel</button>
                    <button onClick={handleSave} className="nebula-button nebula-button-primary">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
