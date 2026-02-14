import React from 'react';

interface BreadcrumbsProps {
    path: string | null;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path }) => {
    if (!path) return <div className="breadcrumb-bar">No file selected</div>;

    const parts = path.split(/[/\\]/);
    const fileName = parts.pop();
    const folderPath = parts.slice(-2).join(' / ');

    return (
        <div className="breadcrumb-bar">
            <span>{folderPath}</span>
            <span style={{ margin: '0 4px', opacity: 0.3 }}>/</span>
            <span style={{ color: 'var(--text-active)', fontWeight: 500 }}>{fileName}</span>
        </div>
    );
};
