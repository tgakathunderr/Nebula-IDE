import React from 'react';

interface PreviewPanelProps {
    previewUrl: string;
    setPreviewUrl: (url: string) => void;
    previewRefreshKey: number;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
    previewUrl,
    setPreviewUrl,
    previewRefreshKey
}) => {
    const handleReload = () => {
        const url = previewUrl;
        setPreviewUrl('');
        setTimeout(() => setPreviewUrl(url), 10);
    };

    const handleOpenExternal = () => {
        window.open(previewUrl, '_blank');
    };

    return (
        <div className="preview-container">
            <div className="panel-header">
                <div className="preview-address-wrapper">
                    <span className="address-icon">🔒</span>
                    <input
                        type="text"
                        value={previewUrl}
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setPreviewUrl((e.target as HTMLInputElement).value)}
                        className="preview-address-bar"
                        placeholder="http://localhost:3000"
                    />
                </div>
                <div className="preview-actions">
                    <button className="icon-button" onClick={handleReload} title="Reload Preview">
                        🔄
                    </button>
                    <button className="icon-button" onClick={handleOpenExternal} title="Open in Browser">
                        ↗
                    </button>
                </div>
            </div>
            <div className="preview-iframe-wrapper">
                <iframe
                    key={`${previewUrl}-${previewRefreshKey}`}
                    src={previewUrl}
                    className="preview-iframe"
                    title="Preview"
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                />
            </div>
        </div>
    );
};
