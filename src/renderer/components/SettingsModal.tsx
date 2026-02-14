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
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="panel-header">
                    <span className="panel-title">AI Settings</span>
                    <button onClick={onClose} className="icon-button" style={{ fontSize: '20px' }}>×</button>
                </div>

                <div className="modal-content">
                    {/* Active Provider */}
                    <div className="form-group">
                        <label className="form-label">Active Model Provider</label>
                        <select
                            value={settings.activeProviderId}
                            onChange={(e) => setSettings({ ...settings, activeProviderId: e.target.value })}
                            className="nebula-input"
                        >
                            <option value="openai">OpenAI (GPT-4o)</option>
                            <option value="ollama">Ollama (Local Models)</option>
                            <option value="mock-ai">Mock AI (Offline)</option>
                        </select>
                    </div>

                    {/* Provider Settings */}
                    <div className="provider-config-box">
                        <h3 className="section-title">
                            {settings.activeProviderId === 'openai' ? 'OpenAI Configuration' : 'Local Node Settings'}
                        </h3>

                        <div className="form-stack">
                            <div className="form-group">
                                <label className="form-label">Model Name</label>
                                <input
                                    type="text"
                                    value={settings.providers[settings.activeProviderId].model}
                                    onChange={(e) => {
                                        const updated = { ...settings };
                                        updated.providers[settings.activeProviderId].model = e.target.value;
                                        setSettings(updated);
                                    }}
                                    className="nebula-input font-mono"
                                />
                            </div>

                            {settings.activeProviderId === 'openai' && (
                                <div className="form-group">
                                    <label className="form-label">API Key</label>
                                    <input
                                        type="password"
                                        placeholder="sk-..."
                                        value={settings.providers.openai.apiKey || ''}
                                        onChange={(e) => {
                                            const updated = { ...settings };
                                            updated.providers.openai.apiKey = e.target.value;
                                            setSettings(updated);
                                        }}
                                        className="nebula-input font-mono"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="nebula-button">Cancel</button>
                    <button onClick={handleSave} className="nebula-button nebula-button-primary">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
